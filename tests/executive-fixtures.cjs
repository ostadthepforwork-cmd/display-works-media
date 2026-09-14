const names=['ป้ายไวนิล','ป้ายอักษรโลหะ','สติ๊กเกอร์ PVC','ป้าย LED','งานพิมพ์ Inkjet'];
const documents=Array.from({length:20},(_,i)=>({id:`fixture-${i}`,type:'receipt',date:i<10?`2026-09-${String(i+1).padStart(2,'0')}`:`2026-08-${String(i+12).padStart(2,'0')}`,dueDate:'',status:i%3===0?'draft':'approved',deleted:false,docNo:`DEMO-RC-${i+1}`,customerId:`customer-${i%4}`,customerName:`บริษัทตัวอย่าง ${i%4+1}`,revenue:40000+(i%5)*12000,estimatedCost:20000+(i%5)*3000,uncertainCost:false,balanceDue:0,items:[{productId:`product-${i%5}`,name:names[i%5],revenue:40000+(i%5)*12000,cost:20000+(i%5)*3000}]}));
documents.push({...documents[0],id:'quote',type:'quote',status:'sent',docNo:'DEMO-QT-001'});
documents.push({...documents[0],id:'invoice',type:'invoice',status:'sent',dueDate:'2026-09-05',balanceDue:20000,docNo:'DEMO-IV-001'});
const categories=[{id:'ad',name:'ค่าโฆษณา'},{id:'rent',name:'ค่าเช่าสำนักงาน'},{id:'shipping',name:'ค่าขนส่ง'},{id:'other',name:'ซอฟต์แวร์'}];
const expenses=Array.from({length:8},(_,i)=>({id:`expense-${i}`,expense_date:i<4?`2026-09-0${i+1}`:`2026-08-${i+20}`,total_amount:String(i<4?[45000,28000,17000,10000][i]:10000),payment_status:i===3?'unpaid':'paid',voided_at:null,category_id:categories[i%4].id,expense_class:i%4===2?'direct':'operating'}));
module.exports={documents,expenses,categories};
