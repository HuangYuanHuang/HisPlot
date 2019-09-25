using HanaTechHisPlot.HanaTechWCFService;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using System.Web;

namespace HanaTechHisPlot.Models
{
    public class TagModel
    {
        public string name { get; set; }
        public string text { get; set; }

        public string service { get; set; }
    }

    public class TagMainModel : BaseWcfModel
    {
        /// <summary>
        /// 服务器列表
        /// </summary>
        static List<string> ListService = new List<string>();
        /// <summary>
        /// 数据库类型
        /// </summary>
        static string strRTDBType = "";

        static TagMainModel()
        {
            strRTDBType = HanaTech.Lib.ConfigHelper.GetConfigString("RTDBType");
        }

        public TagMainModel()
        {
            if (ListService.Count == 0)
            {
                try
                {
                    //获取数据库服务器列表
                    ListService = WcfClient.GetRTDBHostList();
                }
                catch (Exception ex)
                {
                    HanaTech.Lib.LogHelper.WriteLog(ex, "Hisplot");
                }
            }
        }

        /// <summary>
        /// 根据条件获取用户列表
        /// </summary>
        /// <param name="tag">查询条件</param>
        /// <returns></returns>
        public async Task<IEnumerable<TagModel>> GetTagList(string tag)
        {
            List<TagList> listRes = new List<TagList>();

            try
            {
                var list = new List<TagList>();

                //循环服务列表
                foreach (var item in ListService)
                {
                    if (string.IsNullOrEmpty(strRTDBType) || strRTDBType == "Aspen")
                    {
                        //标准
                        list = await Task<List<TagList>>.Factory.FromAsync(WcfClient.BeginGetTagList,
                                     WcfClient.EndGetTagList, tag, item, null);
                    }
                    else
                    {
                        //上海石化
                        list = await Task<List<TagList>>.Factory.FromAsync(WcfClient.BeginGetTagList,
                                       WcfClient.EndGetTagList, string.Format("{0}{1}", item.Replace(strRTDBType, ""), tag), item, null);

                    }

                    listRes.AddRange(list);

                    //if (listRes.Count >= 20)
                    //{
                    //    break;
                    //}
                }
            }
            catch(Exception ex)
            {
                HanaTech.Lib.LogHelper.WriteLog(ex, "Hisplot");
            }

            return listRes.Select(d => new TagModel()
            {
                service = d.服务器名称,
                name = d.位号名称,
                text = d.描述,
            });

        }
    }
}