#pragma once

#include "Common.h"

//size �Ǵ�С
//num �Ǹ���
class ThreadCache
{
public:
	//�����ڴ���ͷ��ڴ�
	void* Allocte(size_t size);
	void Deallocte(void* ptr, size_t size);

	//�����Ļ����ȡ����
	void * FetchFromCentralCache(size_t index);

	//������������еĶ��󳬹�һ�����Ⱦ�Ҫ�ͷŸ����Ļ���
	void ListTooLong(FreeList& freeList, size_t num, size_t size);
private:
	FreeList _freeLists[NFREE_LIST];


	//��������ʵ�о�̬��Thread Cache
	//��ÿһ��ThreadCache���󴮳�һ��������ÿһ��ThreadCache ����
	// ThreadCache* _next;
	// int threadId;
};

//��̬�� �߳�TLS Thread Loacl Storage

_declspec (thread) static ThreadCache* pThreadCache = nullptr;