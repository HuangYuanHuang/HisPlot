using System;
using System.Linq;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace HanaTechHisPlot.Models
{
    public class LineModel
    {
        public string TagName { get; set; }
        public string Color { get; set; }
        public int Width { get; set; }
        public bool Display { get; set; }
        public float MinValue { get;  set; }
        public float MaxValue { get;  set; }
        public float AvgValue { get; private set; }
        public string Field { get; set; }
        public int FieldValue { get; set; }
        public string FieldType { get; set; }
        public float CompMin { get; set; }
        public float CompMax { get; set; }
        public bool AutoMinMax { get; set; }
        public int OffsetValue { get; set; }
        public float RealMin { get; set; }//保留原始最小值
        public float RealMax { get; set; }//保留原始最大值
        public List<LineDataNode> Data { get; set; } = new List<LineDataNode>();
        public void SetMinMaxValue(bool val, double min, double max)
        {
            Data = Data.Where(d => d.ValueStr != "非数字").ToList();
            if (Data.Count() > 0)
            {
                Data.Sort(new LineDataNode());
                RealMin = CompMin = Data.Min(d => d.Value);
                RealMax = CompMax = Data.Max(d => d.Value);

                var temp = (CompMax - CompMin) / 10;
                CompMin -= temp;
                CompMax += temp;

                AvgValue = Data.Average(d => d.Value);
            }
            if (!val)
            {
                this.MinValue = (float)min;
                this.MaxValue = (float)max;
            }
            else
            {
                this.MaxValue = this.CompMax;
                this.MinValue = this.CompMin;
            }
            if (CompMax - CompMin < 0.001)
            {
                CompMax += 1;
                CompMin -= 1;
            }
            if (MaxValue - MinValue < 0.001)
            {
                MaxValue += 1;
                MinValue -= 1;
            }
        }
    }

    public class LineDataNode : IComparer<LineDataNode>
    {
        [DisplayName("时间")]
        public string Time { get; set; }
        public string ValueStr { get; set; }
        [DisplayName("值")]
        public float Value
        {
            get
            {
                double temp = double.NaN;
                var res = Double.TryParse(ValueStr, out temp);
                if (!res)
                {

                    ValueStr = "非数字";
                }
                return (float)temp;
            }
        }

        [DisplayName("可信度")]
        public string Confidence { get; set; }
        public int Compare(LineDataNode x, LineDataNode y)
        {
            return DateTime.Parse(x.Time).CompareTo(DateTime.Parse(y.Time));
        }
    }

    public class MainCanvasModel : BaseWcfModel
    {
        public string StartTime { get; set; }
        public string EndTime { get; set; }
        public IEnumerable<LineModel> Lines { get; set; }

        public async Task<MainCanvasModel> InitData(List<QueryModel> listParam)
        {
            // return await InitRandromData(listParam);
            if (HanaTech.Lib.ConfigHelper.GetConfigString("HisPlotServiceFrom").ToUpper() == "HTTP")
            {
                return await InitRTDBData(listParam);
            }
            else
            {
                return await InitWcfData(listParam);
            }
        }


        public async Task<MainCanvasModel> InitWcfData(List<QueryModel> listParam)
        {
            //判断是否url参数同位号比对 时间参数偏移
            //bool isSameCompare = false;
            //if (listParam.GroupBy(d => d.TagName).Count() > 0)
            //{
            //    isSameCompare = true;
            //}


            QueryParamService<HanaTechWCFService.QueryParam> queryParamService = new Models.QueryParamService<HanaTechWCFService.QueryParam>();

            var queryList = queryParamService.GetQueryParams(listParam);

            Func<Task<Dictionary<string, List<HanaTechWCFService.TagValueList>>>> serviceAction = async () =>
            {
                try
                {
                    using (HanaTechWCFService.WCFAspenClient wcfWebClient = new HanaTechWCFService.WCFAspenClient())
                    {
                        return await Task<Dictionary<string, List<HanaTechWCFService.TagValueList>>>.Factory.FromAsync(wcfWebClient.BeginGetTagProcessDataListByMap,
                                              wcfWebClient.EndGetTagProcessDataListByMap, queryList, null);
                    }
                }
                catch (Exception ex)
                {
                    throw new Exception($"WCF 获取数据ERROR V2:{ex.Message}");
                }
            };
            var queryDataWebService = new QueryDataWebService<HanaTechWCFService.TagValueList>(serviceAction, listParam);

            return await queryDataWebService.GetMainCanvasModel();

        }


        public async Task<MainCanvasModel> InitRTDBData(List<QueryModel> listParam)
        {
            //判断是否url参数同位号比对 时间参数偏移
            //bool isSameCompare = false;
            //if (listParam.GroupBy(d => d.TagName).Count() > 0)
            //{
            //    isSameCompare = true;
            //}
            QueryParamService<HanaTechRTDBWebService.QueryParam> queryParamService = new Models.QueryParamService<HanaTechRTDBWebService.QueryParam>();

            var queryList = queryParamService.GetQueryParams(listParam);

            Func<Task<Dictionary<string, List<HanaTechRTDBWebService.TagValueList>>>> serviceAction = async () =>
           {
               try
               {
                   using (HanaTechRTDBWebService.RTDBServiceClient wcfWebClient = new HanaTechRTDBWebService.RTDBServiceClient())
                   {
                       return await Task<Dictionary<string, List<HanaTechRTDBWebService.TagValueList>>>.Factory.FromAsync(wcfWebClient.BeginGetTagProcessDataListByMap,
                                             wcfWebClient.EndGetTagProcessDataListByMap, queryList, null);
                   }
               }
               catch (Exception ex)
               {
                   throw new Exception($"RTDB获取数据ERROR V2:{ex.Message}");
               }
           };
            var queryDataWebService = new QueryDataWebService<HanaTechRTDBWebService.TagValueList>(serviceAction, listParam);

            return await queryDataWebService.GetMainCanvasModel();
        }


    }
}