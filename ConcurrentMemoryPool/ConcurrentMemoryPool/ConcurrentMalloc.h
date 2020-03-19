#pragma once

#include "ThreadCache.h"
#include "PageCache.h"


void * ConcurrentMalloc(size_t size)
{
	if (size < MAX_SIZE) // [1byte, 64kb]
	{
		if (pThreadCache == nullptr)
		{
			pThreadCache = new ThreadCache;
			cout << std::this_thread::get_id() << "->" << pThreadCache << endl;
		}

		return pThreadCache->Allocte(size);
	}
	else if (size <= ((MAX_PAGE - 1) << PAGE_SHIFT)) // ��64kb,128*4k]
	{
		size_t align_size = SizeClass::_RoundUp(size, 1 << PAGE_SHIFT); //���ж��ٸ�4k,���ٸ�ҳһ��
		size_t pagenum = (align_size >> PAGE_SHIFT); //��4k���ж���ҳ
		Span* span = PageCache::GetInstance().NewSpan(pagenum); //������ô���span,��NewSpan�����Ѿ�������pageid
		span->_objSize = align_size;
		//�� NewSpan�� �Ѿ������Page_id;
		void* ptr = (void*)(span->_pageid << PAGE_SHIFT);

		return ptr;
	}
	else  //[128*4kb.-] ֱ�ӵ���Virtualloc ����
	{
		size_t align_size = SizeClass::_RoundUp(size, 1 << PAGE_SHIFT);
		size_t pagenum = (align_size >> PAGE_SHIFT);
		return SystemAlloc(pagenum); //ֱ������pagenum��ҳ
	}
}

void ConcurrentFree(void* ptr)
{
	size_t pageid = (PAGE_ID)ptr >> PAGE_SHIFT;
	Span* span = PageCache::GetInstance().GetIdToSpan(pageid);
	if (span == nullptr) // [128*4kb,-] ��Ϊû��ӳ���ϵ
	{
		SystemFree(ptr); //�ײ���ǵ��õ�VirtualFree
		return;
	}
	size_t size = span->_objSize;
	if (size <= MAX_SIZE) // [1byte,64kb]
	{
		pThreadCache->Deallocte(ptr, size);
	}
	else if (size <= (MAX_SIZE - 1) << PAGE_SHIFT)
	{
		PageCache::GetInstance().ReleaseSpanToPageCache(span);
	}
}