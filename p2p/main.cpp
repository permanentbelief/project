#define _CRT_SECURE_NO_WARNINGS 1 

#include <boost/filesystem.hpp>
#include "util.hpp"
#include "client.hpp"
#include "httplib.h"


////void helloword(const httplib::Request &req, httplib::Response &rsp)
////{
////	printf("httplib server recv a req: %s\n ", req.path.c_str() );
////	rsp.set_content("<html><h1> �人, ���ͣ�</h1></html>", "text/html");//���һ����������������
////	rsp.status = 200;
////}
////int main()
////{
////	httplib::Server srv;
////	srv.Get("/",helloword);
////
////	srv.listen("0.0.0.0", 9000);
////
////	system("pause");
////}
//////127.0.0.1:9000
////
//#include <iostream>
//#include <boost/filesystem.hpp>
////#include "httplib.h"
//
//void Scandir()
//{
//	//boost::filesystem::path().filename(); //ֻ��ȡ�ļ����� abc/filename.txt->filename.txt
//	//boost::filesystem::exists(); //�ж��ļ��Ƿ����
//	const char*ptr = "./";
//	boost::filesystem::directory_iterator begin(ptr);//����һ��Ŀ¼����������
//	boost::filesystem::directory_iterator end;
//	for (; begin != end; ++begin)
//	{
//		//begin->status() Ŀ¼�е�ǰ�ļ���װ̬��Ϣ
//		// boost::filesystem::is_directory() //�жϵ�ǰ�ļ��Ƿ���һ��Ŀ¼
//		if (boost::filesystem::is_directory(begin->status()))
//		{
//			//begin()->path()->string()��ȡ��ǰ�����ļ����ļ���
//			std::cout << begin->path().string() << "��һ��Ŀ¼�ļ�" << std::endl;
//		}
//		else
//		{
//			std::cout << begin->path().string() << "��һ����ͨ�ļ�" << std::endl;
//			//begin->path().filename().string() ��ȡ�ļ�·�����е��ļ����ƣ���Ҫ·��
//			std::cout << "�ļ���" << begin->path().filename().string() << std::endl;
//		}
//	}
//}
//int main(int argc, char *argv[])
//{
//	Scandir();
//	system("pause");
//}
//

void ClientRun()
{
	Sleep(1);
	Client cli;
	cli.Start();
}

int main()
{
	//�����߳���Ҫ���з����ģ���Լ��ͻ���ģ��
	//������ѭ�� �޷�ֱ�ӷ���

	//����һ���߳����пͻ���ģ�飬���߳����з����ģ��
	//�߳�����һ���߳��������ǲ�һ����
	//���ͻ������е�ʱ�򣬷���˻�û������
	std::thread thr_client(ClientRun);
	
	Server srv;
	srv.Start();

	return 0;
}

//int main()
//{
//	std::vector<Adapter> list;
//	AdapterUtil::GetAllAdapter(&list);
//	system("pause");
//	return 0;
//}