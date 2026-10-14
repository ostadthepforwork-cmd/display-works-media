const assert = require('node:assert/strict');
const fs = require('node:fs');
const http = require('node:http');
const ts = require('typescript');
const { build } = require('esbuild');
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');

(async () => {
  const source = fs.readFileSync('src/app/admin/page.tsx','utf8');
  const ast = ts.createSourceFile('admin.tsx',source,ts.ScriptTarget.Latest,true,ts.ScriptKind.TSX);
  const form = ast.statements.find(n=>ts.isFunctionDeclaration(n)&&n.name?.text==='CustomerForm');
  const customerPage = ast.statements.find(n=>ts.isFunctionDeclaration(n)&&n.name?.text==='CustomerPage');
  let save;
  function visit(node) {
    if(ts.isVariableDeclaration(node)&&node.name.getText(ast)==='save') save=node.getText(ast);
    ts.forEachChild(node,visit);
  }
  visit(customerPage);
  assert(form&&save);
  const bundle = await build({stdin:{contents:`
    import React,{useState,useEffect} from 'react'; import {createRoot} from 'react-dom/client';
    import {THAI_PROVINCES,validateCustomerLocation,customerProvince,customerPostalCode} from './src/lib/customer-geography';
    function Field({label,children}){return <div className="admin-field"><label>{label}</label>{children}</div>;}
    function Btn({children,onClick}){return <button onClick={onClick}>{children}</button>;}
    ${form.getText(ast)}
    const write=async(row,id)=>({data:await (await fetch('/customers',{method:'POST',body:JSON.stringify({...row,id})})).json(),error:null});
    const supabase={from:()=>({insert:row=>({select:()=>({single:()=>write(row)})}),update:row=>({eq:(_key,id)=>write(row,id)})})};
    function App(){
      const [customers,setCustomers]=useState([]);const [editing,setEditing]=useState(null);const [toast,setToast]=useState('');
      const showToast=message=>setToast(message);
      useEffect(()=>{fetch('/customers').then(r=>r.json()).then(rows=>setCustomers(rows.map(c=>({...c,taxId:c.tax_id,customerSegment:c.customer_segment,businessType:c.business_type,postalCode:c.postal_code}))));},[]);
      const ${save};
      const blank={id:'',name:'QA Location',contact:'',phone:'',email:'',address:'',province:'',postalCode:'',taxId:'',customerSegment:'B2C',businessType:''};
      return <main><button onClick={()=>setEditing(blank)}>Add customer</button><button disabled={!customers.length} onClick={()=>setEditing(customers[0])}>Edit customer</button>
        {editing&&<CustomerForm data={editing} onSave={save} onCancel={()=>setEditing(null)}/>}
        <output role="status">{toast}</output>
        {customers.map(c=><div key={c.id} data-testid="geography">{customerProvince(c)} / {customerPostalCode(c)}</div>)}
      </main>;
    }createRoot(document.getElementById('root')).render(<App/>);
  `,resolveDir:process.cwd(),loader:'tsx'},bundle:true,write:false,jsx:'automatic'});
  let rows=[]; let writes=0;
  const server=http.createServer(async(req,res)=>{
    if(req.url==='/test.js'){res.setHeader('Content-Type','text/javascript');return res.end(bundle.outputFiles[0].text);}
    if(req.url==='/customers'){
      res.setHeader('Content-Type','application/json');
      if(req.method==='POST'){
        let body='';for await(const chunk of req)body+=chunk;
        const row={...JSON.parse(body),id:'qa-customer'};rows=[row];writes++;return res.end(JSON.stringify(row));
      }return res.end(JSON.stringify(rows));
    }
    res.end('<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><style>*{box-sizing:border-box}body{margin:0;padding:12px;font:14px Arial}main{max-width:500px;margin:auto}.admin-field{min-width:0}input,select,textarea{width:100%;padding:10px;font:inherit}button{min-height:40px}</style><div id="root"></div><script src="/test.js"></script>');
  });
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  let browser;
  try{
    browser=await chromium.launch({channel:'msedge',headless:true});
    const page=await browser.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));
    await page.goto(`http://127.0.0.1:${server.address().port}`);
    await page.getByRole('button',{name:'Add customer'}).click();
    await page.getByLabel('จังหวัด',{exact:true}).selectOption('จันทบุรี');
    await page.getByLabel('รหัสไปรษณีย์',{exact:true}).fill('2221');
    await page.getByRole('button',{name:'บันทึก',exact:true}).click();
    assert((await page.getByRole('alert').textContent()).includes('5 หลัก'));assert.equal(writes,0);
    await page.getByLabel('รหัสไปรษณีย์',{exact:true}).fill('22110');
    for(const width of [1280,390]){
      await page.setViewportSize({width,height:900});
      assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
      await page.screenshot({path:`output/playwright/customer-location-${width}.png`,fullPage:true});
    }
    await page.getByRole('button',{name:'บันทึก',exact:true}).click();
    await page.getByTestId('geography').waitFor();
    assert.equal(rows[0].province,'จันทบุรี');assert.equal(rows[0].postal_code,'22110');
    await page.reload();await page.getByTestId('geography').waitFor();
    assert.equal(await page.getByTestId('geography').textContent(),'จันทบุรี / 22110');
    await page.getByRole('button',{name:'Edit customer'}).click();
    assert.equal(await page.getByLabel('รหัสไปรษณีย์',{exact:true}).inputValue(),'22110');
    await page.getByLabel('จังหวัด',{exact:true}).selectOption('ชลบุรี');
    await page.getByLabel('รหัสไปรษณีย์',{exact:true}).fill('20150');
    await page.getByRole('button',{name:'บันทึก',exact:true}).click();
    await page.waitForFunction(()=>document.querySelector('[data-testid="geography"]')?.textContent==='ชลบุรี / 20150');
    assert.equal(writes,2);assert.deepEqual(errors,[]);
    console.log(JSON.stringify({syntheticOnly:true,actualFormAndSaveHandler:true,addEditReload:true,validation:true,desktopMobile:true,geography:'ชลบุรี / 20150'}));
  }finally{if(browser)await browser.close();await new Promise(resolve=>server.close(resolve));}
})().catch(e=>{console.error(e);process.exitCode=1;});
