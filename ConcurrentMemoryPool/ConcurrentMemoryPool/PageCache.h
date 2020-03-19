#pragma once

#include "Common.h"

class PageCache
{
public:
	Span* _NewSpan(size_t numpage); //�ݹ�Ĳ��� ��ֹ�����ݹ���

	//����һ��numpageҳ ��span
	Span* NewSpan(size_t numpage);

	void ReleaseSpanToPageCache(Span* span);

	Span* GetIdToSpan(PAGE_ID id); //ͨ��ӳ�䷵��span

	static PageCache& GetInstance()
	{
	    static  PageCache pageCacheInst;
		return pageCacheInst;
	}
private:
	SpanList _spanLists[MAX_PAGE];
	std::map<PAGE_ID, Span*> _idSpanMap; // ���� ҳ�� �� span��ӳ��

	PageCache()
	{

	}
	PageCache(const PageCache&) = delete;

};

//static PageCache pageCacheInst;