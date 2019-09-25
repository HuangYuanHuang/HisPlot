using HanaTechHisPlot.Models;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Net;
using System.Net.Http;
using System.Threading.Tasks;
using System.Web.Http;

namespace HanaTechHisPlot.Controllers
{
    [AllowAnonymous]
    public class HisPlotListController : ApiController
    {
        [HttpPost]
       
        public async Task<MainCanvasModel> Post([FromBody]IEnumerable<QueryModel> querys)
        {
            var canvasModel = new MainCanvasModel();
            var res = await canvasModel.InitData(querys.ToList());
            return res;
        }


    }
}
