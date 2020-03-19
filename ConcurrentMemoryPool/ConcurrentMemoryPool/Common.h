#pragma once

#include <iostream>
#include <assert.h>

#include <thread>
#include <mutex>
#include <map>


#ifdef _WIN32
#include <windows.h>
#endif 

//using namespace std;

using std::endl;
using std::cout;

const size_t MAX_SIZE = 64 * 1024;// 64ҳ
const size_t NFREE_LIST = MAX_SIZE / 8; //���������µ��������

const size_t PAGE_SHIFT = 12; // 4kΪҳ ��λ
const size_t MAX_PAGE = 129; //PageCache�����ҳ[1,128]



inline void*& NextObj(void* obj) //��ȡ��һ���ڵ�ĵ�ַ
{
	return *((void**)obj);
}
class FreeList
{
private:
	void* _freelist = nullptr;
	size_t _num = 0;
public:
	void Push(void* obj)
	{
		//ͷ��
		NextObj(obj) = _freelist;
		_freelist = obj;
		++_num;
	}
	void PushRange(void* head, void* tail,size_t num) //������һ�������Сsize
	{
		NextObj(tail) = _freelist;
		_freelist = head;
		_num += num;
	}

	size_t PopRange(void*& start, void*& end, size_t num) //��������
	{
		size_t actualNum = 0;
		void* prev = nullptr;
		void* cur = _freelist;
		for (; actualNum < num && cur != nullptr; ++actualNum)
		{
			prev = cur;
			cur = NextObj(cur);
		}

		start = _freelist;
		end = prev;
		_freelist = cur;
		_num -= actualNum;

		return actualNum;
	}
	void *Pop()
	{
		//ͷɾ
		void* obj = _freelist;
		_freelist = NextObj(obj);
		_num--;
		return obj;
	}
	bool Empty()
	{
		return _freelist == nullptr;
	}
	void Clear() //���� ���� ��ô����ģ�
	{
		_freelist = nullptr;
	}
	size_t Num()
	{
		return _num;
	}
};

class SizeClass
{
public:
	/*static size_t ListIndex(size_t size)
	{
		if (size % 8 == 0)
		{
			return  size / 8 - 1;

		}
		else
		{
			return size / 8;
		}
	}*/
	/*static size_t RoundUp(size_t size) //���������ϵ� ���뵽�ֽ���
	{
		if (size % 8 != 0)
		{
			return (size / 8 + 1) * 8;
		}
		else
		{
			return size;
		}
	}*/

	//������[%1,10%]���ҵ�����Ƭ�˷�
	//[1,128] 8byte���� freelist[0.16)
	//[129,1024] 16byte���� freelist[16,72)
	//[1025,8*1024] 128byte���� freelist[72,128)
	//[8*1024+1,64*1024] 1024byte���� freelist[128,184)
	
	static size_t _RoundUp(size_t size, int alignment)
	{
		return (size + alignment - 1)&(~(alignment - 1));
	}

	// [9-16] + 7 = [16,13] -> 16 8 4 2 1
	// [17-32] + 15 = [32,47] -> 32 16 8 4 2 1 ������Ӳ�̫ǡ��(��Ӧ��>128 <=1024)����˼��������������
	static inline size_t RoundUp(size_t size)
	{
		assert(size <= MAX_SIZE);

		if (size <= 128)
		{
			return _RoundUp(size, 8);
		}
		else if (size <= 1024)
		{
			return _RoundUp(size, 16);
		}
		else if (size <= 8192)
		{
			return _RoundUp(size, 128);
		}
		else if (size <= 65536)
		{
			return _RoundUp(size, 1024);
		}
		return -1;
	}

	static size_t _ListIndex(size_t size, int align_shift)
	{
		return ((size + (1 << align_shift) - 1) >> align_shift) - 1;
	}

	static size_t ListIndex(size_t size)
	{
		assert(size <= MAX_SIZE);

		// ÿ�������ж��ٸ���
		static int group_array[4] = { 16, 56, 56, 56 };
		if (size <= 128)
			return _ListIndex(size, 3);
		else if (size <= 1024)
			return _ListIndex(size - 128, 4) + group_array[0];
		else if (size <= 8192)
			return _ListIndex(size - 1024, 7) + group_array[0] + group_array[1];
		else if (size <= 65535)
			return _ListIndex(size - 8192, 10) + group_array[0] + group_array[1] + group_array[2];
		
		return -1;

	}
	// ������[2,512]��֮��
	static size_t NumMoveSize(size_t size) //��������ٸ�size��С�Ķ���
	{
		if (size == 0)
			return 0;
		int num = MAX_SIZE / size;
		if (num < 2)
			num = 2;
		if (num > 512)
			num = 512;

		return num;
	}
	static size_t NumMovePage(size_t size) //���������ҳ��Page
	{
		size_t num = NumMoveSize(size);
		size_t npage = num*size;

		npage >>= 12;
		if (npage == 0)
			npage = 1;

		return npage;
	}
};

//////////////////////////////////////////////////////////
// span ��� ����ҳΪ��λ���ڴ���󣬱����Ƿ������ϲ�������ڴ���Ƭ����


//��� windows
# ifdef _WIN32
typedef unsigned int PAGE_ID; //32λ�� unsigned int ���Ա�ʾ������ҳ
#else
typedef unsigned long long PAGE_ID //64λ�� unsiged int ���ܱ�ʾ������ҳ
#endif


struct Span
{
	PAGE_ID _pageid; //ҳ��
	int _pagesize;  //ҳ������

	size_t _objSize = 0; //������������С

	FreeList _freeList; //�������������
	int _usecount; //�ڴ����ʹ�ü���

	Span* _next;
	Span* _prev;
};


class SpanList
{
public:
	SpanList()
	{
		_head = new Span;
		_head->_next = _head;
		_head->_prev = _head;
	}
	Span* Begin()
	{
		return _head->_next;
	}
	Span* End()
	{
		return _head;
	}
	void Insert(Span* pos, Span* newspan)
	{
		Span* prev = pos->_prev;

		//prev   newspan   pos

		prev->_next = newspan;
		pos->_prev = newspan;
		newspan->_next = pos;
		newspan->_prev = prev;
	}
	void Erase(Span* pos)
	{
		assert(pos != _head);


		Span* prev = pos->_prev;
		Span* next = pos->_next;

		prev->_next = next;
		next->_prev = prev;
	}
	void PushFront(Span* newspan) // ͷ��
	{
		Insert(_head->_next, newspan);
	}
	void PopFront()
	{
		Erase(_head->_next);
	}

	void PushBack(Span* newspan)
	{
		Insert(_head, newspan);
	}
	void PopBack()
	{
		Erase(_head->_prev);
	}
	bool Empty()
	{
		return Begin() == End();
	}
	void Lock()
	{
		_mtx.lock();
	}
	void UnLock()
	{
		_mtx.unlock();
	}
private:
	Span* _head;
	std::mutex _mtx;
};

inline static void * SystemAlloc(size_t num_page)
{
#ifdef _WIN32
	void* ptr = VirtualAlloc(0, num_page*(1 << PAGE_SHIFT),                 //����virtuallAlloc �� brk, mmp
		MEM_COMMIT | MEM_RESERVE ,PAGE_READWRITE);
#else
	// brk mmp�ȵ�
#endif
	if (ptr == nullptr)
		throw std::bad_alloc();

	return ptr;
}

inline static void SystemFree(void* ptr)
{
#ifdef _WIN32
	VirtualFree(ptr, 0, MEM_RELEASE); //�ͷŴ��ڴ� > 128*4k  Ҳ���� >128ҳ���ڴ� ������VirtualFree�ͷ�
#else
#endif
}