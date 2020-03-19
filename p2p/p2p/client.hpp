# pragma once

#include<thread>				//C++�����̵߳�ͷ�ļ�
#include <boost/filesystem.hpp>
#include "util.hpp"
#include "httplib.h"


#define P2P_PORT 9000    //�˿ں�
#define MAX_IPBUFFER 16 //������
//1����10λ 1k ����20λ 1M  100 ����20λ 100M  �ֿ鴫�������
#define MAX_RANGE (100*1024*1024)





#define SHARED_PATH "./Shared/" //����Ŀ¼
#define DOWNLOAD_PATH "./Download/" //���ص�Ŀ¼�ļ���


//#include "util.hpp"
//#include <boost/filesystem.hpp>
//
//#include "httplib.h"
//#include "thread" //C++�����̵߳�ͷ�ļ�



class Host
{
public:
	uint32_t _ip_addr; //Ҫ��Ե�����ip��ַ
	bool _pair_ret; //���ڴ����Խ�����ɹ�Ϊtrue
};

//�߳���ں��������һ�����ʹ�÷�����Ҫ����&
class Client
{
public:
	bool Start() //��ʼ��������ɿͻ������й��ܵ�����
	{
		while (1)//�ͻ�����Ҫѭ�����У���Ϊ�����ļ�����������һ���ļ�������һ�οͻ���
			// GetOnlineHost()���涼����о�������������ԣ����ǲ�����û��Ҫ��
		{
			GetOnlineHost(); //�������õ�GetShareList �� ��GetShareList�����ֻ���õ� RangeDownload();
			
		}
		return true;
	}
	//������Ե��߳���ں���
	void HostPair(Host* host) //��Ϊ����ĳ�Ա��������һ��������this,����Ҫ��һ��thisָ��
	{
		//1.��֯http��ʽ��������
		//2.�һ��tcp�ͻ���,�����ݷ���
		//3.�ȴ�����˵Ļظ��������н���
		//�������ʹ�õ�������httplibʵ��
		host->_pair_ret = false;
		char buf[MAX_IPBUFFER] = { 0 };
		inet_ntop(AF_INET, &host->_ip_addr, buf, 16); //�������ֽ����ip��ַת��Ϊ �ַ�����ip��ַ�����ʮ���Ƶģ�
		httplib::Client cli(buf, P2P_PORT); //ʵ����httplib�ͻ��˶���
		auto rsp = cli.Get("/hostpair")  ;//�����˷�����ԴΪ/hostpair��GET����/�������������ӽ���ʧ��Get�᷵��NULL
		if (rsp && rsp->status == 200) //�ж���Ӧ����Ƿ���ȷ
		{
			host->_pair_ret = true; //����������Խ��
		}
		return;
	}
	bool GetOnlineHost() // ��ȡ��������
	{
		char ch = 'Y';  //�Ƿ����ƥ�䣬Ĭ���ǽ���ƥ���
		if (!_online_host.empty())
		{
			std::cout << "�Ƿ����²鿴��������(Y/N):";
			fflush(stdout);
			std::cin >> ch;
		}
		
		if (ch == 'Y')
		{
			std::cout << "��ʼ����ƥ��..." << std::endl;
			// 1.s ��ȡ������Ϣ�������õ������������е�ip��ַ�б�
			std::vector<Adapter> list;
			AdapterUtil::GetAllAdapter(&list);

			//��ȡ��������ip��ַ����ӵ�host_list��
			std::vector<Host> host_list;
			for (int i = 0; i < list.size(); i++) //�õ�����������ip��ַ�б�
			{
				uint32_t ip = list[i]._ip_addr;
				uint32_t mask = list[i]._mask_addr;

				//ע�⣺�����ֽ����Ǵ���ֽ��������ֽ�����С���ֽ���
				//��ת��ΪС���ֽ���Ȼ���ڽ��в���
				//ntohs ת��ΪС���ֽ���



				//���������
				uint32_t net = ntohl(ip&mask);
				//�������������
				uint32_t max_host = (~ntohl(mask)); 


				//std::vector<bool> ret_list(max_host);
				for (int j = 1; j < max_host; j++)
				{
					uint32_t host_ip = net + j;//���������ip����Ӧ��ʹ�������ֽ��������ź�������
					//	// 2. �����ip��ַ�б����������
					//	//std::thread thr(&Client::HostPair,this,host_ip);
					//	//thr.join();// ��һֱ��������

					//	// �ֲ����� ����Ҫ��thread*
					//	//thr_list.push_back(std::thread(&Client::HostPair, this, host_ip));1Y9
					//	thr_list[i] = new std::thread(&Client::HostPair, this, host_ip,&ret_list[i]);
					//	//ƥ��ɹ���ret_list[i]��Ϊtrue ƥ��ʧ�ܽ�ret_list[i]��Ϊfalse; 
					//}
					//for (int j = 1; j < max_host; j++)
					//{
					//	thr_list[i]->join();//�ȴ��߳��˳����߳��˳����������ȴ��һ���ǳɹ��ġ��п����������ֶ�û�н�������
					//	//�߳��˳� ��˵���߳���ں�����������ˣ���һ����Գɹ���
					//	//������һ�ַ�ʽȥ�ж��Ƿ� �ɹ� vector<bool>
					//	delete thr_list[i];
					//}
					Host host;
					host._ip_addr = htonl(host_ip); //����������ֽ����IP��ַת��Ϊ�����ֽ���
					host._pair_ret = false;
					host_list.push_back(host);
				}
				// 2. �����ip��ַ�б����������

			}
			//��host_list�е����������߳̽������                                               //thr_listֱ��
			std::vector<std::thread*> thr_list(host_list.size());                               //����Ҳ���Զ���һ��vector<thread> Ȼ��void Hostpair() ������host_list[i]������
			for (int i = 0; i < host_list.size(); i++)
			{
				thr_list[i] = new std::thread(&Client::HostPair, this, &host_list[i]);

			}
			std::cout << "��������ƥ���У����Ժ�...\n";
			// �ȴ������߳�����������,�ж���Խ����������������ӵ�_online_host��
			for (int i = 0; i < host_list.size(); i++)
			{
				thr_list[i]->join();
				if (host_list[i]._pair_ret == true)
				{
					_online_host.push_back(host_list[i]);
				}
				delete thr_list[i]; //��������� Ҫ�ͷ�
			}
			
				// 3. ���������õ���Ӧ�����Ӧ����Ϊ���ߣ���ip��ַ��ӵ�_online_list�б���

		}
		
		// 4. ��ӡ���������б�ʹ�û�ѡ��

		//�����е���������IP��ӡ���������û�ѡ��
		for (int i = 0; i < _online_host.size(); i++)
		{
			char buf[MAX_IPBUFFER] = { 0 };
			inet_ntop(AF_INET, &_online_host[i]._ip_addr, buf, MAX_IPBUFFER);
			std::cout << "\t" << buf << std::endl;
		}
		std::cout << "��ѡ�������������ȡ�ļ��б�: ";
		fflush(stdout);
		std::string select_ip;
		std::cin >> select_ip;
		GetShareList(select_ip);//�û�ѡ������֮��,���û�ȡ�ļ��б�ӿ�

		return true;
	}
	bool GetShareList(const std::string &host_ip)  // ��ȡ�ļ��б�
	{
		httplib::Client cli(host_ip.c_str(), P2P_PORT); //ʵ������һ��cli�ͻ��˶���
		auto rsp = cli.Get("/list");
		if (rsp == NULL || rsp->status != 200)
		{
			std::cerr << "��ȡ�ļ��б���Ӧ����\n";
			return false;
		}
		//��ӡ����--��ӡ�������Ӧ���ļ������б��û�ѡ��
		//body: filename1\r\n filename2 \r\n
		std::cout << rsp->body << std::endl;
		std::cout << "\n��ѡ��Ҫ���ص��ļ�:";
		fflush(stdout);
		std::string filename;
		std::cin >> filename;
		RangeDownload(host_ip, filename);
		return true;
	}
	bool DownloadFile( const std::string& host_ip, const std::string& filename) //  �����ļ�
	{
		//1. �����˷����ļ���������
		//2. �õ���Ӧ�������Ӧ�Ľ����body��Ӧ�ľ����ļ�����
		//3. �����ļ������ļ�д���ļ��У��ر��ļ�
		std::string req_path = "/download/" + filename;
		httplib::Client cli(host_ip.c_str() , P2P_PORT);

		std::cout << "�����˷����ļ���������:" << std::endl;

		auto rsp = cli.Get(req_path.c_str());
		if (rsp == NULL || rsp->status != 200)
		{
			std::cout << "�����ļ�����ȡ��Ӧ��Ϣʧ��" << rsp->status << std::endl;
			return false;
		}
		std::cout << "��ȡ�ļ�������Ӧ�ɹ�\n";
		//���ͻ��˵�����Ŀ¼�Ƿ���ڣ��������򴴽�
		if (!boost::filesystem::exists(DOWNLOAD_PATH))
		{
			boost::filesystem::create_directory(DOWNLOAD_PATH); 
		}

		std::string realpath = DOWNLOAD_PATH + filename;
		if (FileUtil::Write(realpath, rsp->body) == false)
		{
			std::cerr << "�ļ�����ʧ��\n";
			return false;
		}
		std::cout << "�ļ����سɹ�\n";
		return true;
	}
	bool RangeDownload(const std::string& host_ip, const std::string& name)
	{
		//1.����HEAD����ͨ����Ӧ�е�Content-Length��ȡ�ļ���С
		//2.�����ļ���С���зֿ�
		//3.��һ����ֿ����ݣ��õ���Ӧ֮��д���ļ���ָ��λ��
		std::string req_path = "/download/" + name;
		httplib::Client cli(host_ip.c_str(), P2P_PORT);
		auto rsp = cli.Head(req_path.c_str());
		if (rsp == NULL || rsp->status != 200)
		{
			std::cout << "��ȡ�ļ���С��Ϣʧ��\n";
			return false;
		}
		//��һ���Ϳ��Ի�ȡ�ļ���С��    
		std::string clen = rsp->get_header_value("Content-Length"); //�����Content-Length������ �Ǵ�ӡ��������
		//! !!!!!!!!!!!!!!!!!!!!!!!!!!! Ϊʲô��һ������ �⺯�� atoi��stoi ���ַ���ת��Ϊ���� ������������
		int64_t filesize = StringUtil::Str2Dig(clen);
		//2.�����ļ���С���зֿ�
		//a.���ļ���СС�ڿ��С����ֱ�������ļ�
		//int range_count = filesize / MAX_RANGE;
		if (filesize < MAX_RANGE)
		{
			std::cout << "�ļ���С��ֱ�������ļ�" << std::endl;
			return DownloadFile(host_ip, name);
		}
		//b.���ļ���С�����������С�����ļ���С���Էֿ��СȻ��+1
		//c. ���ļ���С�պ��������С����ֿ���������ļ���С���Էֿ��С
		

		std::cout << "�ļ����󣬷ֿ��������\n" << std::endl;
		//����ֿ����
		int range_count = 0;
		if (filesize % MAX_RANGE == 0) // MAX_RANGE����Ϊ 100M
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
			if (i == (range_count - 1)) //���һ���ֿ�Ĵ�С
			{
				range_end = filesize - 1;
			}
			else
			{
				range_end = (i + 1)*MAX_RANGE - 1;
			}
			std::cout << "�ͻ�������ֿ飺" << range_start << "-" << range_end << std::endl;

			//3.��һ����ֿ������е����ݣ��õ���Ӧ֮��д���ļ���ָ��λ��
			////��һ����֯Rangeͷ��Ϣ
			//std::stringstream tmp;
			//tmp << "bytes=" << range_start << "-" << range_end; //��֯һ��Rangeͷ��Ϣ������ֵ

			//Headersһ��map���͵ı�
			httplib::Headers header;
			header.insert(httplib::make_range_header({ { range_start, range_end } }));//����һ��range����
			httplib::Client cli(host_ip.c_str(), P2P_PORT);

			//header.insert(std::make_pair("Range", tmp.str()));// tmp.str()�ǻ�ȡstringstream�����������Ϣ����Ϊstring���󷵻�
			auto rsp = cli.Get(req_path.c_str(), header); //Get�кܶ�����غ��������Դ�ͷ��Ϣ����ȡ����˷��ص�
			if (rsp == NULL || rsp->status != 206)
			{
				std::cout << "���������ļ�ʧ��\n";
				return false;
			}
			FileUtil::Write(name, rsp->body, range_start);//�ļ��� ���� ƫ����
		}
		std::cout << "�ļ����سɹ�" << std::endl;
		return true;
	}
private:
	std::vector<Host> _online_host;
};



//������� 
/*
���ߺ���


Ϊʲôѡ����̣߳�
��Ϊ��һ���������ڵ���������������Ӳ��ϵģ������лظ���Ϊ�˲��д�����ʡʱ�䡣
*/

class Server
{
public:
	bool Start()
	{
		//��Կͻ�������Ĵ���ʽ������Ӧ��ϵ��Ҳ����ע����Ϣ
		_srv.Get("/hostpair",HostPair);
		_srv.Get("/list",ShareList);
		_srv.Get("/download/.*", DownLoad); //������ʽ

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
	//��ȡ�����ļ��б�--��������������һ������Ŀ¼���������Ŀ¼�µ��ļ�����Ҫ��������˵�
	static void ShareList(const httplib::Request& req, httplib::Response& rsp)
	{
		//1.�鿴Ŀ¼�Ƿ���ڴ��ڣ���Ŀ¼�����ڣ��򴴽����Ŀ¼
		if (!boost::filesystem::exists(SHARED_PATH))
		{
			boost::filesystem::create_directory(SHARED_PATH);
		}
		boost::filesystem::directory_iterator begin(SHARED_PATH);//ʵ����Ŀ¼������
		boost::filesystem::directory_iterator end; //ʵ����Ŀ¼��������ĩβ
		//��ʼĿ¼����
		for (; begin != end; ++begin)
		{
			//��ǰ����ֻ��ȡ��ͨ���ļ����ƣ�������㼶����
			if (boost::filesystem::is_directory(begin->status()))
				continue;
			std::string name = begin->path().string(); //filename1\r\nfilename2\r\n
			rsp.body += name + "\r\n";

		}
		rsp.status = 200;
		return;
	}

	//�����ļ�
	static void DownLoad(const httplib::Request &req, httplib::Response& rsp)
	{
		//// std::cout << "������յ��ļ���������" << req.path << std::endl;
		//req.path --�ͻ���������Դ��·��  /download/filename.txt
		boost::filesystem::path req_path(req.path); //ʵ������req_path
		std::string name = req_path.filename().string(); //ֻ��ȡ�ļ����ƣ� filename.txt

		////std::cout << "�����ʵ���յ����ļ��������ƣ�" << name << "·����" << SHARED_PATH << std::endl;

		std::string realpath = SHARED_PATH  + name;// ʵ���ļ���·��Ӧ�����ڹ����Ŀ¼��
		//boost::filesystem::exists()�ļ��Ƿ����

		//std::cout << "�����ʵ���յ����ļ�����·����" << realpath << std::endl;

	
		if (!boost::filesystem::exists(realpath) || boost::filesystem::is_directory(realpath))
		{
			rsp.status = 404;
			return;
		}
	
		if (req.method == "GET")
		{ 
			//��ǰ��GET���󣬾���ֱ�������������ļ����������ڲ�һ���ˣ��������˷ֿ鴫���������
			//�ж��Ƿ��зֿ鴫������ݣ���������������Ƿ���Rangeͷ���ֶ�
			if (req.has_header("Range"))  //�ж�����ͷ���Ƿ����Range�ֶ�
			{
				//����һ���ֿ鴫��
				//��Ҫ֪���ֿ������Ƕ���
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
				//û��Rangeͷ��������һ���������ļ�����
				if (FileUtil::Read(realpath, &rsp.body) == false)
				{
					rsp.status = 500;
					return;
				}
				rsp.status = 200;
			}
			
		}
		else // req.method == "HEAD"  
			//����������HEAD�����---�ͻ���ֻҪͷ������Ҫ����
		{
			int64_t filesize = FileUtil::GetFileSize(realpath); //��ȡ�ļ��Ĵ�С
			rsp.set_header("Content-Length", std::to_string(filesize));//������Ӧ��Ϣ����ͷ�������Ӧ�ֶΡ� key-valueģ��
																	  //set_header(const string &key,const string& value)
			rsp.status = 200;
		}
	}
};


//��5�ڿ�  1:28���Ե� md5 �ֿ鴫��
//  1:40 - 1:45�δ���


//�����Ľڿ� 46min


//�����ڿο��� 2 19min