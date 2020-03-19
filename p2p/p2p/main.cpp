#define _CRT_SECURE_NO_WARNINGS 1 

#include <boost/filesystem.hpp>
#include "util.hpp"
#include "client.hpp"
#include "httplib.h"


////void helloword(const httplib::Request &req, httplib::Response &rsp)
////{
////	printf("httplib server recv a req: %s\n ", req.path.c_str() );
////	rsp.set_content("<html><h1> 武汉, 加油！</h1></html>", "text/html");//最后一个参数是正文类型
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
//	//boost::filesystem::path().filename(); //只获取文件名称 abc/filename.txt->filename.txt
//	//boost::filesystem::exists(); //判断文件是否存在
//	const char*ptr = "./";
//	boost::filesystem::directory_iterator begin(ptr);//定义一个目录迭代器对象
//	boost::filesystem::directory_iterator end;
//	for (; begin != end; ++begin)
//	{
//		//begin->status() 目录中当前文件的装态信息
//		// boost::filesystem::is_directory() //判断当前文件是否是一个目录
//		if (boost::filesystem::is_directory(begin->status()))
//		{
//			//begin()->path()->string()获取当前迭代文件的文件名
//			std::cout << begin->path().string() << "是一个目录文件" << std::endl;
//		}
//		else
//		{
//			std::cout << begin->path().string() << "是一个普通文件" << std::endl;
//			//begin->path().filename().string() 获取文件路径名中的文件名称，不要路径
//			std::cout << "文件名" << begin->path().filename().string() << std::endl;
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
	//在主线程中要运行服务端模块以及客户端模块
	//都是死循环 无法直接返回

	//创建一个线程运行客户端模块，主线程运行服务端模块
	//线程中哪一个线程先运行是不一定的
	//若客户端运行的时候，服务端还没有启动
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