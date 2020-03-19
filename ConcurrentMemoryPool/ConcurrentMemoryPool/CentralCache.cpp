#define _CRT_SECURE_NO_WARNINGS 1 

#include "CentralCache.h"
#include "PageCache.h"


Span* CentralCache::GetOneSpan(size_t size) //��spanlist�л�ȡһ��span ���� ��page cache�л�ȡһ��span
{
	//��CentralCache�� ���һ��span
	size_t index = SizeClass::ListIndex(size); // ����size���span������±�

	SpanList& spanlist = _spanLists[index];
	Span* it = spanlist.Begin();

	while (it != spanlist.End())
	{
		if (!it->_freeList.Empty())
		{
			return it;
		}
		else
		{
			it = it->_next;
		}
	}
	//��Central Cache��û�����span
	//���pagecache�� ��ȡһ��span
	size_t numpage = SizeClass::NumMovePage(size);//�����������ҳ

	Span* span = PageCache::GetInstance().NewSpan(numpage);//��PageCache ����numpageҳ��sapn

	//�������гɶ�Ӧ��С��span���ص�span��freelist��ȥ
	char* start = (char*)(span->_pageid << 12);  // * 4k
	char* end = start + (span->_pagesize << 12); //*4k

	while (start < end)
	{
		char* obj = start;
		start += size;

		span->_freeList.Push(obj);
	}

	span->_objSize = size;
	spanlist.PushFront(span);

	return span;
}

//������Cache��ȡһ�������Ķ����thread cache
size_t CentralCache::FetchRangeObj(void*& start, void*& end, size_t num, size_t size)
{
	//�û�����spanLists���±꣬����
	size_t index = SizeClass::ListIndex(size);
	SpanList& spanlist = _spanLists[index];
	
	spanlist.Lock();
	Span* span = GetOneSpan(size);
	FreeList& freelist = span->_freeList;
	size_t actualNum = freelist.PopRange(start, end, num);
	span->_usecount += actualNum;

	spanlist.UnLock();

	return actualNum;
}

void CentralCache::ReleaseListToSpans(void* start, size_t size)
{
	size_t index = SizeClass::ListIndex(size); //���spanLists���±�
	SpanList& spanlist = _spanLists[index];
	

	spanlist.Lock();
	while (start) //����һ��ѭ�������ȥ�� Ҫע�ⲻһ����spanLists�ϵ�ͬһ��span
	{
		void* next = NextObj(start); //��start����һ��ֵ
		PAGE_ID id = (PAGE_ID)start >> PAGE_SHIFT; //��ַ/4k ��ҳ�� ��Ϊһҳ4k
		Span* span = PageCache::GetInstance().GetIdToSpan(id); // ͨ��[page_ID,span*]��ӳ�䣬 ������һ��sapn
		span->_freeList.Push(start);
		span->_usecount--;


		//��ʾ��ǰspan�г�ȥ�Ķ�����ȫ���أ����Խ�span����pageCache���кϲ�
		if (span->_usecount == 0)
		{
			size_t index = SizeClass::ListIndex(span->_objSize);
			_spanLists[index].Erase(span);
		
			span->_freeList.Clear(); //ʲô��˼ ������ ������� ��ֹ���� 

			PageCache::GetInstance().ReleaseSpanToPageCache(span);



		}

		start = next;
	}

	spanlist.UnLock();
}