#pragma once

#include "Common.h"


//�ø�Ϊ����ģʽ
class CentralCache
{
public:
	//������Cache��ȡһ�������Ķ����thread cache
	size_t FetchRangeObj(void*& start, void*& end, size_t num, size_t size);


	//��һ�������Ķ����ͷŵ�span���
	void ReleaseListToSpans(void* start, size_t size);

	//��spanlist ���� page chche��ȡһ��span
	Span* GetOneSpan(size_t size);

	static CentralCache& GetInstance()
	{
		static CentralCache inst;
		return inst;
	}
private:
	CentralCache()
	{

	}

	CentralCache(const CentralCache&) = delete;
	SpanList _spanLists[NFREE_LIST];
};


//static CentralCache centralCacheInst;