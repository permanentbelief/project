#define _CRT_SECURE_NO_WARNINGS 1 

/*
�ڴ���Ƭ
����
�߲���������
*/

#include "ThreadCache.h"
#include "CentralCache.h"

void* ThreadCache::Allocte(size_t size)
{
	size_t index = SizeClass::ListIndex(size); //���ݶ����С��� ����������±�
	FreeList& freeList = _freeLists[index];
	if (! freeList.Empty())  //�����Ϊ�� ��ȡ��һ������
	{
		return freeList.Pop();
	}
	else
	{
		return FetchFromCentralCache(SizeClass::RoundUp(size));//����������뵽size��Ӧ��λ�ã�ȥCentral Cache ��ȡ������С��
	}
}

void ThreadCache::Deallocte(void* ptr, size_t size)
{
	size_t index = SizeClass::ListIndex(size); //������������е��±�
	FreeList& freeList = _freeLists[index];
	freeList.Push(ptr);


	//�����������һ������ | �����ڴ�Ĵ�С 2MB
	size_t num = SizeClass::NumMoveSize(size); //����ĸ��� ������[2,512]֮��
	if (freeList.Num() >= num)
	{
		ListTooLong(freeList, num, size);
	}
	//if()
	{
		//ReleaseToCentralCache();
	}
}


// ��������  Thread Cache
//void* ThreadCache::FetchFromCentralCache(size_t index)
//{
//	size_t num = 20;
//
//	//����ģ���ڴ�ȡ����Ĵ��룬����Thread Cache���߼�
//	size_t size = (index + 1) * 8;
//	char* start = (char*)malloc(size*num);
//	char* cur = start;
//	for (size_t i = 0; i < num - 1; ++i)
//	{
//		char* next = cur + size;
//		NextObj(cur) = next;
//
//		cur = next;
//	}
//	NextObj(cur) = nullptr;
//
//	void* head = NextObj(start);
//	void* tail = cur;
//	_freeLists[index].PushRange(head, tail);
//	return  start;
//}
void ThreadCache::ListTooLong(FreeList& freeList,size_t num, size_t size)
{
	void* start = nullptr;
	void* end = nullptr;
	freeList.PopRange(start, end, num);//������һ��start��endָ�� ��������һ�ε�ͷ��β

	//��Ϊβ��һ�����Ǹ�����Ľ���λ�ã����滹���ź���ĵ�ַ������Ҫ�ÿ�һ��
	NextObj(end) = nullptr;

	CentralCache::GetInstance().ReleaseListToSpans(start, size);

}
void * ThreadCache::FetchFromCentralCache(size_t size)
{
	size_t num = SizeClass::NumMoveSize(size); // ����thread������ٸ�  [2,512]

	void* start = nullptr;
	void* end = nullptr;
	size_t actualNum = CentralCache::GetInstance().FetchRangeObj(start, end, num, size);

	if (actualNum == 1)
		return start;
	else
	{
		size_t index = SizeClass::ListIndex(size);
		FreeList& list = _freeLists[index];
		list.PushRange(NextObj(start), end, num);

		return start;
	}

}