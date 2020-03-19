#include "pageCache.h"


Span* PageCache::NewSpan(size_t numpage)
{
	//_spanLists[numpage].Lock();
	return _NewSpan(numpage);
	//_spanLists[numpage].UnLock();
}
Span* PageCache::_NewSpan(size_t numpage)
{
	//_spanLists[numpage].Lock();


	//�ڵ�ǰnumpage�Ͽ����pageCache����û��numspage����С��sapn
	if (!_spanLists[numpage].Empty())
	{
		Span* span = _spanLists[numpage].Begin();
		_spanLists[numpage].PopFront();
		return span;
	}
	for (int i = numpage + 1; i < MAX_PAGE; ++i)
	{
		if (!_spanLists[i].Empty())
		{
			//����
			Span* span = _spanLists[i].Begin();
			
			_spanLists[i].PopFront(); //��������iҳȫ�ó���

			//����ҳ �г� Сҳ �Ĺ��̣� �����л�Ҫ�ı�ӳ���ϵ

			Span* splitspan = new Span;
		/*	splitspan->_pageid = span->_pageid + numpage;
			splitspan->_pagesize = span->_pagesize - numpage;
			span->_pagesize = numpage;

			_spanLists[splitspan->_pagesize].PushFront(splitspan);


			return span;*/
			splitspan->_pageid = span->_pageid + span->_pagesize - numpage;
			splitspan->_pagesize = numpage;

			//�ı�ӳ���ϵ
			for (int i = 0; i < numpage; i++)
			{
				_idSpanMap[splitspan->_pageid + i] = splitspan;
			}

			span->_pagesize -= numpage;


			//���и����һ�� ���뵽���Ӧ��spanLists��ȥ
			_spanLists[span->_pagesize].PushFront(span);

			return splitspan;
		}
	}

	//��ϵͳ����
	void *ptr = SystemAlloc(MAX_PAGE - 1); //��ҳ����ʽ����

	Span* bigspan = new Span;
	bigspan->_pageid = (PAGE_ID)ptr >> PAGE_SHIFT; //���ҳ��
	bigspan->_pagesize = MAX_PAGE - 1; // ҳ�Ĵ�С 129 - 1


	//ӳ��
	for (PAGE_ID i = 0; i < bigspan->_pagesize; ++i)
	{
		_idSpanMap[bigspan->_pageid + i] = bigspan;
	}

	//�����128ҳ�Ĵ�ҳ ���뵽_spanLists��128��λ��
	_spanLists[bigspan->_pagesize].PushFront(bigspan);

	//�ٴε����Լ�
	return NewSpan(numpage);
}


// �ϲ���Сҳ �ϳ� ��ҳ �Ĺ��̣� ������PageCache��spanLists��
void PageCache::ReleaseSpanToPageCache(Span* span)
{
	//��ǰ�ϲ�
	while (1)
	{
		PAGE_ID prevPageId = span->_pageid - 1; //�����spam->_pageid ��Ӧ�������ֵ��
		auto pit = _idSpanMap.find(prevPageId);
		//��ǰ��Ҳ������
		if (pit == _idSpanMap.end())
		{
			break;
		}

		//���ǰ�ߵ�ҳ��usecount��������0��˵��ǰ���ҳ����ʹ���У����ܽ��кϲ�
		Span* prevSpan = pit->second;
		if (prevSpan->_usecount != 0)
		{
			break;
		}
		//�ϲ�
		span->_pageid = prevSpan->_pageid;
		span->_pagesize += prevSpan->_pagesize;

		for (PAGE_ID i = 0; i < prevSpan->_pagesize; i++)
		{
			_idSpanMap[prevSpan->_pageid + i] = span;
		}

		// ��spanList�Ͻ� prevspanȡ����
		_spanLists[prevSpan->_pagesize].Erase(prevSpan);
		delete prevSpan;
	}

	//���ϲ�
	while (1)
	{
		PAGE_ID nextPageId = span->_pageid + span->_pagesize;
		auto nextIt = _idSpanMap.find(nextPageId);
		if (nextIt == _idSpanMap.end())
		{
			break;
		}
		
		Span* nextSpan = nextIt->second;

		if (nextSpan->_usecount != 0)
		{
			break;
		}
		span->_pagesize += nextSpan->_pagesize;
		for (PAGE_ID i = 0; i < nextSpan->_pagesize; i++)
		{
			_idSpanMap[nextSpan->_pageid + i] = span;
		}

		_spanLists[nextSpan->_pagesize].Erase(nextSpan);
		delete nextSpan;
	}


	//���ϲ��õĴ��Span�ŵ� PageCache�ж�Ӧ��Span
	_spanLists[span->_pagesize].PushFront(span);
}


Span* PageCache::GetIdToSpan(PAGE_ID id)
{
	std::map<PAGE_ID, Span*>::iterator it = _idSpanMap.find(id);

	// ������Ϊnullptr����Ϊ����Ϊnullptr ˵��id���ˣ�ǰ���е�����
	if (it == _idSpanMap.end())
	{
		return nullptr;
	}
	else
	{
		return it->second;
	}
}