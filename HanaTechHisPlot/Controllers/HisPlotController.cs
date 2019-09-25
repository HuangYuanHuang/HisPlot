using System;
using System.CodeDom.Compiler;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Text.RegularExpressions;
using System.Threading.Tasks;
using System.Web;
using System.Web.Mvc;
using DoddleReport.Web;
using HanaTechHisPlot.Models;
using Microsoft.CSharp;

namespace HanaTechHisPlot.Controllers
{
    public class HisPlotController : Controller
    {
        GridModel gridModel = null;
        MainCanvasModel canvasModel = null;
        TagMainModel tagModel = null;

        // GET: HisPlot
        public ActionResult Index()
        {
            return View();
        }

        public ActionResult Tree()
        {
            return View();
        }

        public ActionResult Demo()
        {
            return View();
        }

        [HttpPost]
        public async Task<JsonResult> List(IEnumerable<QueryModel> querys)
        {
            canvasModel = new MainCanvasModel();

            var res = await canvasModel.InitData(querys.Where(d => d.TagName?.Length > 0).ToList());

            return Json(res);
        }

        [HttpPost]
        public async Task<JsonResult> Grid(IEnumerable<QueryModel> querys)
        {
            gridModel = new GridModel();
            //var res = await gridModel.LoadGrids(querys.ToList(),true);

            var res = await gridModel.LoadGrids(querys.Where(d => d.TagName?.Length > 0).ToList());

            return Json(res);
        }

        [HttpPost]
        public JsonResult VailExpression(string expression)
        {
            var isInclueChinese = Regex.IsMatch(expression, "[\u4e00-\u9fa5]", RegexOptions.IgnoreCase);
            if (isInclueChinese)
            {
                return Json(new { state = false });
            }

            expression = Regex.Replace(expression, @"[\w|:|.]{2,}", "66");
            var codeTemplate = "using System;namespace ANameSpace { static class AClass{ public static object AFunc(){  return " + expression + ";}}}";
            CSharpCodeProvider provider = new CSharpCodeProvider();
            CompilerParameters parameter = new CompilerParameters();
            parameter.ReferencedAssemblies.Add("System.dll");
            parameter.GenerateExecutable = false;
            parameter.GenerateInMemory = true;
            CompilerResults result = provider.CompileAssemblyFromSource(parameter, codeTemplate);
            if (result.Errors.Count > 0)
            {
                return Json(new { state = false });
            }
            return Json(new { state = true });
        }

        [HttpPost]
        public async Task<JsonResult> Search(string id)
        {
            tagModel = new TagMainModel();
            var list = await tagModel.GetTagList("%" + id + "%");
            return Json(list);
        }

        public async Task<ReportResult> Report()
        {
            string tagName = Request.QueryString["name"];
            string start = Request.QueryString["start"];
            string end = Request.QueryString["end"];
            List<QueryModel> querys = new List<QueryModel>()
            {
                new QueryModel() { End=end,Start=start,TagName=tagName},
            };
            MainCanvasModel model = new MainCanvasModel();
            var res = await model.InitData(querys.ToList());
            if (res?.Lines?.Count() < 1)
            {
                return null;
            }
            var list = res.Lines.ToList()[0].Data;
            var report = list.ListViewModelToReport<LineDataNode>();
            var parm = querys.ToList()[0];
            report.TextFields.Title = parm.TagName;
            report.RenderHints.BooleanCheckboxes = true;
            report.RenderHints.BooleansAsYesNo = true;
            report.RenderHints.FreezeRows = 10;
            report.RenderHints.FreezeColumns = 3;
            report.DataFields[0].DataFormatString = "{0:s}";
            report.TextFields.SubTitle = parm.Start.Replace("/", "-") + " - " + parm.End.Replace("/", "-");
            report.TextFields.Footer = string.Format("Copyright {0} (c) 趋势图", DateTime.Now.Year);
            report.TextFields.Header = $@"
                    位号名称：{parm.TagName}
                    时间间隔：{(DateTime.Parse(parm.End) - DateTime.Parse(parm.Start)).TotalSeconds}秒 
                    最小值：{list.Min(d => d.Value)} 
                    最大值：{list.Max(d => d.Value)}
                    创建时间：{DateTime.Now.ToString("yyyy-MM-dd HH:mm:ss")}";
            return new ReportResult(report) { FileName = parm.TagName + ".xlsx" };
        }

        [HttpPost]
        public string ExportImage()
        {
            var data = Request.Form["image"];
            data = data.Substring(data.IndexOf(',') + 1);
            data = HttpUtility.HtmlDecode(data);
            var imageArr = Convert.FromBase64String(data);
            long path = DateTime.Now.ToFileTime();
            Stream s = new FileStream($"{Server.MapPath("~/export/")}{path}.jpg", FileMode.Append);
            s.Write(imageArr, 0, imageArr.Length);
            s.Close();
            return path.ToString();
        }

        public FileResult ImageDown(string id)
        {
            return File($"{Server.MapPath("~/export/")}{id}.jpg", "application/octet-stream", id + ".jpg");
        }

        protected override void Dispose(bool disposing)
        {
            try
            {
                if (tagModel != null)
                {
                    tagModel.Close();
                }
                if (canvasModel != null)
                {
                    canvasModel.Close();
                    // HanaTech.Lib.LogHelper.WriteLog("canvasModel.WcfClient is Close");
                }
                if (gridModel != null)
                {
                    gridModel.Close();
                    //  HanaTech.Lib.LogHelper.WriteLog("gridModel.WcfClient is Close");
                }
            }
            catch (Exception ex)
            {
                HanaTech.Lib.LogHelper.WriteLog(ex);
            }
        }
    }
}