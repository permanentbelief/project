# pragma once

#include<thread>				//C++创建线程的头文件
#include <boost/filesystem.hpp>
#include "util.hpp"
#include "httplib.h"


#define P2P_PORT 9000    //端口号
#define MAX_IPBUFFER 16 //缓冲区
//1左移10位 1k 左移20位 1M  100 左移20位 100M  分块传输的最大块
#define MAX_RANGE (100*1024*1024)





#define SHARED_PATH "./Shared/" //共享目录
#define DOWNLOAD_PATH "./Download/" //下载的目录文件夹


//#include "util.hpp"
//#include <boost/filesystem.hpp>
//
//#include "httplib.h"
//#include "thread" //C++创建线程的头文件



class Host
{
public:
	uint32_t _ip_addr; //要配对的主机ip地址
	bool _pair_ret; //用于存放配对结果，成功为true
};

//线程入口函数针对于一个类的使用方法，要传入&
class Client
{
public:
	bool Start() //起始函数，完成客户端所有功能的整合
	{
		while (1)//客户端需要循环运行，因为下载文件，不能下载一次文件就重启一次客户端
			// GetOnlineHost()里面都会进行局域网内主机配对，这是不合理，没必要的
		{
			GetOnlineHost(); //里面会调用到GetShareList ， 在GetShareList里面又会调用到 RangeDownload();
			
		}
		return true;
	}
	//主机配对的线程入口函数
	void HostPair(Host* host) //因为是类的成员函数，有一个隐含的this,所以要传一个this指针
	{
		//1.组织http格式请求数据
		//2.搭建一个tcp客户端,将数据发送
		//3.等待服务端的回复，并进行解析
		//这个过程使用到第三方httplib实现
		host->_pair_ret = false;
		char buf[MAX_IPBUFFER] = { 0 };
		inet_ntop(AF_INET, &host->_ip_addr, buf, 16); //将网络字节序的ip地址转换为 字符串的ip地址（点分十进制的）
		httplib::Client cli(buf, P2P_PORT); //实例化httplib客户端对象
		auto rsp = cli.Get("/hostpair")  ;//向服务端发送资源为/hostpair的GET请求/若三次握手连接建立失败Get会返回NULL
		if (rsp && rsp->status == 200) //判断响应结果是否正确
		{
			host->_pair_ret = true; //重置主机配对结果
		}
		return;
	}
	bool GetOnlineHost() // 获取在线主机
	{
		char ch = 'Y';  //是否进行匹配，默认是进行匹配的
		if (!_online_host.empty())
		{
			std::cout << "是否重新查看在线主机(Y/N):";
			fflush(stdout);
			std::cin >> ch;
		}
		
		if (ch == 'Y')
		{
			std::cout << "开始主机匹配..." << std::endl;
			// 1.s 获取网卡信息，进而得到局域网中所有的ip地址列表
			std::vector<Adapter> list;
			AdapterUtil::GetAllAdapter(&list);

			//获取所有主机ip地址，添加到host_list中
			std::vector<Host> host_list;
			for (int i = 0; i < list.size(); i++) //得到所有主机的ip地址列表
			{
				uint32_t ip = list[i]._ip_addr;
				uint32_t mask = list[i]._mask_addr;

				//注意：网络字节序是大端字节序，主机字节序是小端字节序
				//先转换为小端字节序，然后在进行操作
				//ntohs 转换为小端字节序



				//计算网络号
				uint32_t net = ntohl(ip&mask);
				//计算最大主机号
				uint32_t max_host = (~ntohl(mask)); 


				//std::vector<bool> ret_list(max_host);
				for (int j = 1; j < max_host; j++)
				{
					uint32_t host_ip = net + j;//这个主机的ip计算应该使用主机字节序的网络号和主机号
					//	// 2. 逐个对ip地址列表发送配对请求
					//	//std::thread thr(&Client::HostPair,this,host_ip);
					//	//thr.join();// 将一直卡在这里

					//	// 局部变量 所以要用thread*
					//	//thr_list.push_back(std::thread(&Client::HostPair, this, host_ip));1Y9
					//	thr_list[i] = new std::thread(&Client::HostPair, this, host_ip,&ret_list[i]);
					//	//匹配成功将ret_list[i]置为true 匹配失败将ret_list[i]置为false; 
					//}
					//for (int j = 1; j < max_host; j++)
					//{
					//	thr_list[i]->join();//等待线程退出，线程退出，主机配对却不一定是成功的。有可能三次握手都没有建立起来
					//	//线程退出 ，说明线程入口函数运行完毕了，不一定配对成功。
					//	//还得有一种方式去判断是否 成功 vector<bool>
					//	delete thr_list[i];
					//}
					Host host;
					host._ip_addr = htonl(host_ip); //将这个主机字节序的IP地址转换为网络字节序
					host._pair_ret = false;
					host_list.push_back(host);
				}
				// 2. 逐个对ip地址列表发送配对请求

			}
			//对host_list中的主机创建线程进行配对                                               //thr_list直接
			std::vector<std::thread*> thr_list(host_list.size());                               //这里也可以定义一个vector<thread> 然后void Hostpair() 传引用host_list[i]的引用
			for (int i = 0; i < host_list.size(); i++)
			{
				thr_list[i] = new std::thread(&Client::HostPair, this, &host_list[i]);

			}
			std::cout << "正在主机匹配中，请稍后...\n";
			// 等待所有线程主机配对完毕,判断配对结果，将在线主机添加到_online_host中
			for (int i = 0; i < host_list.size(); i++)
			{
				thr_list[i]->join();
				if (host_list[i]._pair_ret == true)
				{
					_online_host.push_back(host_list[i]);
				}
				delete thr_list[i]; //堆上申请的 要释放
			}
			
				// 3. 若配对请求得到响应，则对应主机为在线，则将ip地址添加到_online_list列表中

		}
		
		// 4. 打印在线主机列表，使用户选择

		//将所有的在线主机IP打印出来，供用户选择
		for (int i = 0; i < _online_host.size(); i++)
		{
			char buf[MAX_IPBUFFER] = { 0 };
			inet_ntop(AF_INET, &_online_host[i]._ip_addr, buf, MAX_IPBUFFER);
			std::cout << "\t" << buf << std::endl;
		}
		std::cout << "请选择配对主机，获取文件列表: ";
		fflush(stdout);
		std::string select_ip;
		std::cin >> select_ip;
		GetShareList(select_ip);//用户选择主机之后,调用获取文件列表接口

		return true;
	}
	bool GetShareList(const std::string &host_ip)  // 获取文件列表
	{
		httplib::Client cli(host_ip.c_str(), P2P_PORT); //实例化出一个cli客户端对象
		auto rsp = cli.Get("/list");
		if (rsp == NULL || rsp->status != 200)
		{
			std::cerr << "获取文件列表响应错误\n";
			return false;
		}
		//打印正文--打印服务端响应的文件名称列表供用户选择
		//body: filename1\r\n filename2 \r\n
		std::cout << rsp->body << std::endl;
		std::cout << "\n请选择要下载的文件:";
		fflush(stdout);
		std::string filename;
		std::cin >> filename;
		RangeDownload(host_ip, filename);
		return true;
	}
	bool DownloadFile( const std::string& host_ip, const std::string& filename) //  下载文件
	{
		//1. 向服务端发送文件下载请求
		//2. 得到响应结果，相应的结果中body对应的就是文件数据
		//3. 创建文件，将文件写入文件中，关闭文件
		std::string req_path = "/download/" + filename;
		httplib::Client cli(host_ip.c_str() , P2P_PORT);

		std::cout << "向服务端发送文件下载请求:" << std::endl;

		auto rsp = cli.Get(req_path.c_str());
		if (rsp == NULL || rsp->status != 200)
		{
			std::cout << "下载文件，获取响应信息失败" << rsp->status << std::endl;
			return false;
		}
		std::cout << "获取文件下载响应成功\n";
		//看客户端的下载目录是否存在，不存在则创建
		if (!boost::filesystem::exists(DOWNLOAD_PATH))
		{
			boost::filesystem::create_directory(DOWNLOAD_PATH); 
		}

		std::string realpath = DOWNLOAD_PATH + filename;
		if (FileUtil::Write(realpath, rsp->body) == false)
		{
			std::cerr << "文件下载失败\n";
			return false;
		}
		std::cout << "文件下载成功\n";
		return true;
	}
	bool RangeDownload(const std::string& host_ip, const std::string& name)
	{
		//1.发送HEAD请求，通过响应中的Content-Length获取文件大小
		//2.根据文件大小进行分块
		//3.逐一请求分块数据，得到响应之后写入文件的指定位置
		std::string req_path = "/download/" + name;
		httplib::Client cli(host_ip.c_str(), P2P_PORT);
		auto rsp = cli.Head(req_path.c_str());
		if (rsp == NULL || rsp->status != 200)
		{
			std::cout << "获取文件大小信息失败\n";
			return false;
		}
		//这一步就可以获取文件大小了    
		std::string clen = rsp->get_header_value("Content-Length"); //这个“Content-Length”参数 是打印出来的吗？
		//! !!!!!!!!!!!!!!!!!!!!!!!!!!! 为什么这一步不用 库函数 atoi或stoi 将字符串转换为整形 ？？？？？？
		int64_t filesize = StringUtil::Str2Dig(clen);
		//2.根据文件大小进行分块
		//a.若文件大小小于块大小，则直接下载文件
		//int range_count = filesize / MAX_RANGE;
		if (filesize < MAX_RANGE)
		{
			std::cout << "文件较小，直接下载文件" << std::endl;
			return DownloadFile(host_ip, name);
		}
		//b.若文件大小不能整除块大小，则文件大小除以分块大小然后+1
		//c. 若文件大小刚好整除块大小，则分块个数就是文件大小除以分块大小
		

		std::cout << "文件过大，分块进行下载\n" << std::endl;
		//计算分块个数
		int range_count = 0;
		if (filesize % MAX_RANGE == 0) // MAX_RANGE定义为 100M
		{
			range_count = (filesize / MAX_RANGE);
		}
		else
		{
			range_count = (filesize / MAX_RANGE) + 1;
		}
		int64_t range_start = 0;
		int64_t range_end = 0;
		for (int i = 0; i < range_count; i++)
		{
			range_start = i*MAX_RANGE;
			if (i == (range_count - 1)) //最后一个分块的大小
			{
				range_end = filesize - 1;
			}
			else
			{
				range_end = (i + 1)*MAX_RANGE - 1;
			}
			std::cout << "客户端请求分块：" << range_start << "-" << range_end << std::endl;

			//3.逐一请求分块区间中的数据，得到响应之后写入文件的指定位置
			////这一步组织Range头信息
			//std::stringstream tmp;
			//tmp << "bytes=" << range_start << "-" << range_end; //组织一个Range头信息的区间值

			//Headers一个map类型的表
			httplib::Headers header;
			header.insert(httplib::make_range_header({ { range_start, range_end } }));//设置一个range区间
			httplib::Client cli(host_ip.c_str(), P2P_PORT);

			//header.insert(std::make_pair("Range", tmp.str()));// tmp.str()是获取stringstream对象里面的信息，作为string对象返回
			auto rsp = cli.Get(req_path.c_str(), header); //Get有很多的重载函数，可以传头信息，获取服务端返回的
			if (rsp == NULL || rsp->status != 206)
			{
				std::cout << "区间下载文件失败\n";
				return false;
			}
			FileUtil::Write(name, rsp->body, range_start);//文件名 正文 偏移量
		}
		std::cout << "文件下载成功" << std::endl;
		return true;
	}
private:
	std::vector<Host> _online_host;
};



//主机配对 
/*
告诉后者


为什么选择多线程？
因为在一个局域网内的主机，大多是连接不上的，不会有回复。为了并行处理，节省时间。
*/

class Server
{
public:
	bool Start()
	{
		//针对客户端请求的处理方式建立对应关系，也就是注册信息
		_srv.Get("/hostpair",HostPair);
		_srv.Get("/list",ShareList);
		_srv.Get("/download/.*", DownLoad); //正则表达式

		_srv.listen("0.0.0.0", P2P_PORT);
		return true;
	}
private:
	httplib::Server _srv;
private:
	static void HostPair(const httplib::Request& req, httplib::Response& rsp)
	{
		rsp.status = 200;
		return;
	}
	//获取共享文件列表--在主机上设置这一个共享目录，凡是这个目录下的文件都是要共享给别人的
	static void ShareList(const httplib::Request& req, httplib::Response& rsp)
	{
		//1.查看目录是否存在存在，若目录不存在，则创建这个目录
		if (!boost::filesystem::exists(SHARED_PATH))
		{
			boost::filesystem::create_directory(SHARED_PATH);
		}
		boost::filesystem::directory_iterator begin(SHARED_PATH);//实例化目录迭代器
		boost::filesystem::directory_iterator end; //实例化目录迭代器的末尾
		//开始目录迭代
		for (; begin != end; ++begin)
		{
			//当前我们只获取普通的文件名称，并不多层级操作
			if (boost::filesystem::is_directory(begin->status()))
				continue;
			std::string name = begin->path().string(); //filename1\r\nfilename2\r\n
			rsp.body += name + "\r\n";

		}
		rsp.status = 200;
		return;
	}

	//下载文件
	static void DownLoad(const httplib::Request &req, httplib::Response& rsp)
	{
		//// std::cout << "服务端收到文件下载请求：" << req.path << std::endl;
		//req.path --客户端请求资源的路径  /download/filename.txt
		boost::filesystem::path req_path(req.path); //实例化出req_path
		std::string name = req_path.filename().string(); //只获取文件名称： filename.txt

		////std::cout << "服务端实际收到的文件下载名称：" << name << "路径：" << SHARED_PATH << std::endl;

		std::string realpath = SHARED_PATH  + name;// 实际文件的路径应该是在共享的目录下
		//boost::filesystem::exists()文件是否存在

		//std::cout << "服务端实际收到的文件下载路径：" << realpath << std::endl;

	
		if (!boost::filesystem::exists(realpath) || boost::filesystem::is_directory(realpath))
		{
			rsp.status = 404;
			return;
		}
	
		if (req.method == "GET")
		{ 
			//以前的GET请求，就是直接下载完整的文件，但是现在不一样了，现在有了分块传输这个功能
			//判断是否有分块传输的依据，就是这次请求中是否有Range头部字段
			if (req.has_header("Range"))  //判断请求头中是否包含Range字段
			{
				//这是一个分块传输
				//需要知道分块区间是多少
				std::string range_str = req.get_header_value("Range");// byte=start-end
				httplib::Ranges ranges;// vector<Range>          Range-std::pair<start,end>
				httplib::detail::parse_range_header(range_str, ranges);
				int64_t range_start = ranges[0].first;
				int64_t range_end = ranges[0].second;
				int64_t range_len = range_end - range_start + 1;
				std::cout << "range: " << range_start << "-" << range_end << std::endl;
				FileUtil::ReadRange(realpath, &rsp.body, range_len, range_start);
				rsp.status = 206;
			}
			else
			{
				//没有Range头部，则是一个完整的文件下载
				if (FileUtil::Read(realpath, &rsp.body) == false)
				{
					rsp.status = 500;
					return;
				}
				rsp.status = 200;
			}
			
		}
		else // req.method == "HEAD"  
			//这个是针对于HEAD请求的---客户端只要头部，不要正文
		{
			int64_t filesize = FileUtil::GetFileSize(realpath); //获取文件的大小
			rsp.set_header("Content-Length", std::to_string(filesize));//设置响应信息，向头部添加响应字段。 key-value模型
																	  //set_header(const string &key,const string& value)
			rsp.status = 200;
		}
	}
};


