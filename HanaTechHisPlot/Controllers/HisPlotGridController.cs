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
    public class HisPlotGridController : ApiController
    {

        public async Task<IEnumerable<GridModel>> Post([FromBody]IEnumerable<QueryModel> querys)
        {
            var gridModel = new GridModel();

            var res = await gridModel.LoadGrids(querys.ToList());
            return res;
        }


    }
}
