using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using HanaTechHisPlot.Models;

namespace HanaTechHisPlot.Models
{
    public interface IQueryParam
    {

        string 位号名称 { get; set; }
        string 开始日期 { get; set; }
        string 结束日期 { get; set; }
        string 字段 { get; set; }

        int 周期 { get; set; }

    }

    public interface ITagValueList
    {
        string 位号值时间 { set; get; }
        string 位号值 { set; get; }

        string 可信度 { set; get; }


    }
    public class QueryParamComparer<T> : IEqualityComparer<T> where T : IQueryParam
    {
        public bool Equals(T x, T y)
        {
            return x.位号名称 == y.位号名称;
        }

        public int GetHashCode(T obj)
        {
            return obj.GetHashCode() * 108979;
        }
    }

}

namespace HanaTechHisPlot.HanaTechRTDBWebService
{
    public partial class QueryParam : HanaTechHisPlot.Models.IQueryParam
    {

    }

    public partial class TagValueList : HanaTechHisPlot.Models.ITagValueList
    {
    }
}

namespace HanaTechHisPlot.HanaTechWCFService
{
    public partial class QueryParam : HanaTechHisPlot.Models.IQueryParam
    {

    }
    public partial class TagValueList : HanaTechHisPlot.Models.ITagValueList
    {
    }
}