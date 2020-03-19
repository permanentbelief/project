#define _CRT_SECURE_NO_WARNINGS 1 

#include "Common.h"
#include <vector>
#include "ConcurrentMalloc.h"


void BenchMalloc(size_t ntimes, size_t nworks, size_t rounds)
{
	std::vector<std::thread> vthread(nworks);
	size_t malloc_costtime = 0;
	size_t free_costtime = 0;


	for (size_t k = 0; k < nworks; ++k)
	{
		vthread[k] = std::thread([&, k]()
		{
			std::vector<void*> v;
			v.reserve(ntimes);

			for (size_t j = 0; j < rounds; ++j)
			{
				size_t begin1 = clock();
				for (size_t i = 0; i < ntimes; i++)
				{
					v.push_back(malloc(16));
				}
				size_t end1 = clock();

				size_t begin2 = clock();
				for (size_t i = 0; i < ntimes; i++)
				{
					free(v[i]);
				}
				size_t  end2 = clock();

				v.clear();

				malloc_costtime += end1 - begin1;
				free_costtime += end2 - begin2;
			}
		});
	}
	for (auto &t : vthread)
	{
		t.join();
	}

	printf("%u���̲߳���ִ����%u�ִΣ�ÿ�ִ�malloc %u��: ����: %u ms\n",
		nworks, rounds, ntimes, malloc_costtime);

	printf("%u���̲߳���ִ����%u�ִΣ�ÿ�ִ�free %u��:����; %u ms\n",
		nworks, rounds, ntimes, free_costtime);

	printf("%u���̲߳���malloc&free %u�Σ� �ܼƻ���: %u ms\n",
		nworks, nworks*rounds*ntimes, malloc_costtime + free_costtime);
}

void BenchmarkConcurrentMalloc(size_t ntimes, size_t nworks, size_t rounds)
{
	std::vector<std::thread> vthread(nworks);
	size_t malloc_costtime = 0;
	size_t free_costtime = 0;

	for (size_t k = 0; k < nworks; ++k)
	{
		vthread[k] = std::thread([&]()
		{
			std::vector<void*> v;
			v.reserve(ntimes);

			for (size_t j = 0; j < rounds; ++j)
			{
				size_t begin1 = clock();
				for (size_t i = 0; i < ntimes; i++)
				{
					v.push_back(ConcurrentMalloc(16));
				}
				size_t end1 = clock();


				size_t begin2 = clock();
				for (size_t i = 0; i < ntimes; i++)
				{
					ConcurrentFree(v[i]);
				}
				size_t end2 = clock();

				v.clear();

				malloc_costtime += end1 - begin1;
				free_costtime += end2 - begin2;
			}
		}
		);
	}
	for (auto& t : vthread)
	{
		t.join();
	}
	printf("%u���̲߳���ִ����%u�ִΣ�ÿ�ִ�concurrentAlloc %u��: ����: %u ms\n",
		nworks, rounds, ntimes, malloc_costtime);

	printf("%u���̲߳���ִ����%u�ִΣ�ÿ�ִ�concurrent dealloc %u��:����; %u ms\n",
		nworks, rounds, ntimes, free_costtime);

	printf("%u���̲߳���concurrent alloc&dealloc %u�Σ� �ܼƻ���: %u ms\n",
		nworks, nworks*rounds*ntimes, malloc_costtime + free_costtime);
}

int main()
{
	cout << "========================================================" << std::endl;
	BenchMalloc(10000, 4, 10);
	cout << endl << endl;
	BenchmarkConcurrentMalloc(10000, 4, 10);
	cout << "========================================================" << std::endl;

	system("pause");
}