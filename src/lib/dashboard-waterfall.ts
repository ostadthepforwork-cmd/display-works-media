export function dashboardWaterfall(revenue:number,cost:number,gross:number,operating:number|null,after:number|null) {
  const rows = [
    {label:'ยอดขาย',start:0,end:revenue,amount:revenue,kind:'revenue'},
    {label:'ต้นทุน',start:revenue,end:gross,amount:-cost,kind:'deduction'},
    {label:'กำไรขั้นต้น',start:0,end:gross,amount:gross,kind:'subtotal'},
    {label:'Operating',start:gross,end:after,amount:operating===null?null:-operating,kind:'deduction'},
    {label:'กำไรหลังหัก',start:0,end:after,amount:after,kind:'profit'},
  ];
  return rows.map(row=>({...row,range:row.end===null?null:[Math.min(row.start,row.end),Math.max(row.start,row.end)]}));
}
