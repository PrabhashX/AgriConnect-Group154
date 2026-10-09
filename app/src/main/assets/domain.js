/* Shared application service. Runs unchanged in the Android app and browser preview. */
(function (root) {
  'use strict';
  const clone = x => JSON.parse(JSON.stringify(x));
  const fail = message => { throw new Error(message); };
  const twoDecimals = n => Math.abs(n*100-Math.round(n*100))<0.000001;
  const roles = ['buyer', 'farmer', 'rider'];
  const now = () => new Date().toISOString();
  const DELIVERY = 150;
  const statuses = ['Placed', 'Ready for pickup', 'Assigned', 'Picked up', 'Out for delivery', 'Delivered'];
  const seedProducts = [
    ['p1','Vine tomatoes','Vegetables',420,32,'kg','Grade A','Matale','Nimali Farm','tomato','Sun-ripened tomatoes, harvested for direct farm-to-home delivery.'],
    ['p2','Gotukola','Leafy greens',180,25,'bunch','Fresh','Matale','Nimali Farm','leaf','Fresh leafy greens. Rinse thoroughly before preparing.'],
    ['p3','Bitter gourd','Vegetables',340,18,'kg','Grade A','Matale','Nimali Farm','gourd','Freshly harvested bitter gourd, carefully selected at the farm.'],
    ['p4','Wood apple','Fruits',120,40,'piece','Grade A','Matale','Nimali Farm','apple','Locally grown wood apple. Availability is shown in pieces.'],
    ['p5','Bananas','Fruits',260,24,'kg','Grade A','Matale','Nimali Farm','banana','Sweet bananas from the farm. Sold by kilogram.'],
    ['p6','Carrots','Vegetables',380,28,'kg','Grade A','Matale','Nimali Farm','carrot','Crisp carrots with clear price and stock information.']
  ];
  async function digest(password, salt) {
    if (typeof NativeStore !== 'undefined') return NativeStore.hash(password, salt);
    const c = root.crypto || require('node:crypto').webcrypto;
    const material = await c.subtle.importKey('raw',new TextEncoder().encode(password),'PBKDF2',false,['deriveBits']);
    const bits = await c.subtle.deriveBits({name:'PBKDF2',salt:new TextEncoder().encode(salt),iterations:120000,hash:'SHA-256'},material,256);
    return Array.from(new Uint8Array(bits),b=>b.toString(16).padStart(2,'0')).join('');
  }
  function randomSalt() {
    const c = root.crypto || require('node:crypto').webcrypto;
    return Array.from(c.getRandomValues(new Uint8Array(16)),b=>b.toString(16).padStart(2,'0')).join('');
  }
  async function seed() {
    const accounts=[];
    for(const [role,name] of [['buyer','Kasun Perera'],['farmer','Nimali Perera'],['rider','Nuwan Silva']]) {
      const salt=randomSalt();
      accounts.push({id:role+'1',role,name,email:role+'@agriconnect.demo',salt,passwordHash:await digest('Demo@1234',salt),phone:'',address:role==='buyer'?'32/A, Flower Road, Colombo 07':role==='farmer'?'Nimali Farm, Matale':'Colombo',farm:role==='farmer'?'Nimali Farm':'',verified:false,verification:null,favorites:[]});
    }
    return {version:1,seq:100,accounts,products:seedProducts.map(p=>({id:p[0],name:p[1],category:p[2],price:p[3],stock:p[4],unit:p[5],grade:p[6],district:p[7],farm:p[8],art:p[9],description:p[10],farmerId:'farmer1',harvest:new Date().toISOString().slice(0,10),active:true,updated:now()})),carts:{},orders:[],tickets:[],reviews:[]};
  }
  class Service {
    constructor(storage) {this.storage=storage;this.state=null;this.userId=null;}
    async init() { const raw=this.storage.load();this.state=raw?JSON.parse(raw):await seed();this.save();return this; }
    save(){this.storage.save(JSON.stringify(this.state));}
    id(prefix){return prefix+(++this.state.seq);}
    user(){return this.state.accounts.find(a=>a.id===this.userId)||null;}
    need(role){const u=this.user();if(!u)fail('Please sign in first.');if(role&&u.role!==role)fail('This action is not available for your role.');return u;}
    safeUser(u){const {salt,passwordHash,...safe}=u;return clone(safe);}
    async login(email,password,role){const u=this.state.accounts.find(a=>a.email===email.trim().toLowerCase());if(!u||!roles.includes(role)||u.role!==role||u.passwordHash!==await digest(password,u.salt))fail('Email, password or selected role is incorrect.');this.userId=u.id;return this.safeUser(u);}
    logout(){this.userId=null;}
    async register(data){const role=data.role; if(!roles.includes(role))fail('Choose a valid role.');const name=String(data.name||'').trim(),email=String(data.email||'').trim().toLowerCase(),password=String(data.password||'');if(name.length<2||name.length>80)fail('Enter a name between 2 and 80 characters.');if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))fail('Enter a valid email address.');if(password.length<8)fail('Use a password with at least 8 characters.');if(this.state.accounts.some(a=>a.email===email))fail('An account already uses this email.');const salt=randomSalt();const u={id:this.id('u'),role,name,email,salt,passwordHash:await digest(password,salt),phone:'',address:'',farm:'',verified:false,verification:null,favorites:[]};this.state.accounts.push(u);this.save();this.userId=u.id;return this.safeUser(u);}
    updateProfile(data){const u=this.need();const name=String(data.name||'').trim();if(name.length<2||name.length>80)fail('Enter a name between 2 and 80 characters.');const phone=String(data.phone||'').trim();if(phone&&!/^\+?[0-9\s-]{9,16}$/.test(phone))fail('Enter a valid phone number.');Object.assign(u,{name,phone,address:String(data.address||'').trim().slice(0,240),farm:String(data.farm||'').trim().slice(0,80)});this.save();return this.safeUser(u);}
    products(filters={}){this.need();return clone(this.state.products.filter(p=>p.active&&(filters.category==null||filters.category==='All'||p.category===filters.category)&&(!filters.query||(p.name+' '+p.farm+' '+p.district).toLowerCase().includes(filters.query.toLowerCase()))).sort((a,b)=>filters.sort==='price'?a.price-b.price:a.name.localeCompare(b.name)));}
    product(id){this.need();const p=this.state.products.find(p=>p.id===id);if(!p)fail('Product not found.');return clone({...p,verified:!!this.state.accounts.find(a=>a.id===p.farmerId)?.verified});}
    myProducts(){const u=this.need('farmer');return clone(this.state.products.filter(p=>p.farmerId===u.id));}
    saveProduct(data,id){const u=this.need('farmer');const name=String(data.name||'').trim(),price=Number(data.price),stock=Number(data.stock);if(name.length<2||name.length>80)fail('Enter a product name between 2 and 80 characters.');if(!Number.isFinite(price)||price<=0||price>1000000)fail('Price must be between LKR 0.01 and 1,000,000.');if(!Number.isFinite(stock)||stock<0||stock>100000||!twoDecimals(stock))fail('Stock must be a non-negative number with up to two decimal places.');if(!['Vegetables','Fruits','Leafy greens','Herbs'].includes(data.category))fail('Choose a category.');if(!['kg','bunch','piece'].includes(data.unit))fail('Choose a unit.');if(!/^\d{4}-\d{2}-\d{2}$/.test(data.harvest)||data.harvest>new Date().toISOString().slice(0,10))fail('Choose a harvest date that is today or earlier.');let p;if(id){p=this.state.products.find(p=>p.id===id&&p.farmerId===u.id);if(!p)fail('You can only edit your own listings.');}else{p={id:this.id('p'),farmerId:u.id};this.state.products.push(p);}Object.assign(p,{name,price:Math.round(price*100)/100,stock,category:data.category,unit:data.unit,grade:String(data.grade||'Fresh').slice(0,50),district:String(data.district||'').trim().slice(0,80),farm:u.farm||u.name+' Farm',description:String(data.description||'').trim().slice(0,600),art:data.art||'leaf',harvest:data.harvest,active:data.active!==false,updated:now()});this.save();return clone(p);}
    deleteProduct(id){const u=this.need('farmer');const p=this.state.products.find(p=>p.id===id&&p.farmerId===u.id);if(!p)fail('You can only remove your own listings.');this.state.products=this.state.products.filter(p=>p.id!==id);this.save();}
    toggleAvailability(id){const u=this.need('farmer');const p=this.state.products.find(p=>p.id===id&&p.farmerId===u.id);if(!p)fail('Listing not found.');p.active=!p.active;p.updated=now();this.save();}
    favorite(id){const u=this.need('buyer');this.product(id);u.favorites=u.favorites.includes(id)?u.favorites.filter(x=>x!==id):[...u.favorites,id];this.save();}
    cart(){const u=this.need('buyer');return clone(this.state.carts[u.id]||[]);}
    cartLines(){return this.cart().map(line=>({...line,product:clone(this.state.products.find(p=>p.id===line.productId)||null)}));}
    setCart(id,quantity){const u=this.need('buyer');const p=this.state.products.find(p=>p.id===id&&p.active);if(!p)fail('This listing is no longer available.');const q=Number(quantity);if(!Number.isFinite(q)||q<0||q>p.stock||!twoDecimals(q)||(['piece','bunch'].includes(p.unit)&&!Number.isInteger(q)))fail('Enter an available quantity; pieces and bunches use whole numbers.');let cart=this.state.carts[u.id]||[];cart=cart.filter(l=>l.productId!==id);if(q>0)cart.push({productId:id,quantity:q});this.state.carts[u.id]=cart;this.save();}
    removeCart(id){const u=this.need('buyer');this.state.carts[u.id]=(this.state.carts[u.id]||[]).filter(l=>l.productId!==id);this.save();}
    totals(){const lines=this.cartLines();const subtotal=lines.reduce((s,l)=>s+(l.product?.price||0)*l.quantity,0);return {subtotal:Math.round(subtotal*100)/100,delivery:lines.length?DELIVERY:0,total:Math.round((subtotal+(lines.length?DELIVERY:0))*100)/100};}
    checkout(address,payment,note=''){const u=this.need('buyer');const cart=this.cart();if(!cart.length)fail('Your basket is empty.');if(String(address).trim().length<10||String(address).length>240)fail('Enter a complete delivery address (10–240 characters).');if(!['Cash on delivery','Demo payment'].includes(payment))fail('Choose a payment method.');const items=cart.map(l=>{const p=this.state.products.find(p=>p.id===l.productId);if(!p||!p.active||p.stock<l.quantity)fail('Stock changed. Please review your basket.');return {...clone(p),quantity:l.quantity,price:p.price};});if(new Set(items.map(p=>p.farmerId)).size>1)fail('Please order from one farmer at a time for a clear pickup route.');const total=this.totals();const o={id:this.id('AC'),buyerId:u.id,farmerId:items[0].farmerId,riderId:null,items,address:String(address).trim(),pickup:this.state.accounts.find(a=>a.id===items[0].farmerId)?.address||items[0].district,note:String(note).slice(0,240),payment,paymentStatus:payment==='Demo payment'?'Simulated paid':'Due on delivery',status:'Placed',...total,created:now(),timeline:[{status:'Placed',at:now()}]};for(const line of cart){const p=this.state.products.find(p=>p.id===line.productId);p.stock=Math.round((p.stock-line.quantity)*100)/100;}this.state.orders.push(o);this.state.carts[u.id]=[];this.save();return clone(o);}
    orders(){const u=this.need();return clone(this.state.orders.filter(o=>u.role==='buyer'?o.buyerId===u.id:u.role==='farmer'?o.farmerId===u.id:o.riderId===u.id||(!o.riderId&&o.status==='Ready for pickup')).sort((a,b)=>b.created.localeCompare(a.created)));}
    order(id){const o=this.orders().find(o=>o.id===id);if(!o)fail('Order is not available for your account.');return o;}
    cancelOrder(id){const u=this.need('buyer');const o=this.state.orders.find(o=>o.id===id&&o.buyerId===u.id);if(!o||o.status!=='Placed')fail('Only a newly placed order can be cancelled.');for(const item of o.items){const p=this.state.products.find(p=>p.id===item.id);if(p)p.stock=Math.round((p.stock+item.quantity)*100)/100;}o.status='Cancelled';o.paymentStatus=o.payment==='Demo payment'?'Simulated refund':'Not due';o.timeline.push({status:'Cancelled',at:now()});this.save();}
    updateOrderNote(id,note){const u=this.need('buyer');const o=this.state.orders.find(o=>o.id===id&&o.buyerId===u.id);if(!o||!['Placed','Ready for pickup','Assigned'].includes(o.status))fail('Instructions cannot be changed after pickup.');o.note=String(note).trim().slice(0,240);this.save();}
    advanceOrder(id){const u=this.need();const o=this.state.orders.find(o=>o.id===id);if(!o)fail('Order not found.');let next;if(u.role==='farmer'&&o.farmerId===u.id&&o.status==='Placed')next='Ready for pickup';else if(u.role==='rider'&&!o.riderId&&o.status==='Ready for pickup'){next='Assigned';o.riderId=u.id;}else if(u.role==='rider'&&o.riderId===u.id&&['Assigned','Picked up','Out for delivery'].includes(o.status))next=statuses[statuses.indexOf(o.status)+1];else fail('You cannot make this status change.');o.status=next;o.timeline.push({status:next,at:now()});if(next==='Delivered'&&o.payment==='Cash on delivery')o.paymentStatus='Collected';this.save();return clone(o);}
    saveTicket(data,id){const u=this.need();const subject=String(data.subject||'').trim(),message=String(data.message||'').trim();if(subject.length<3||subject.length>80)fail('Use a subject between 3 and 80 characters.');if(message.length<10||message.length>1000)fail('Describe the issue in 10–1000 characters.');if(data.orderId)this.order(data.orderId);let t;if(id){t=this.state.tickets.find(t=>t.id===id&&t.userId===u.id&&t.status==='Open');if(!t)fail('Only your open requests can be edited.');}else{t={id:this.id('SUP'),userId:u.id,status:'Open',created:now()};this.state.tickets.push(t);}Object.assign(t,{subject,message,orderId:data.orderId||'',updated:now()});this.save();return clone(t);}
    tickets(){const u=this.need();return clone(this.state.tickets.filter(t=>t.userId===u.id));}
    deleteTicket(id){const u=this.need();const t=this.state.tickets.find(t=>t.id===id&&t.userId===u.id&&t.status==='Open');if(!t)fail('Only your open requests can be withdrawn.');this.state.tickets=this.state.tickets.filter(t=>t.id!==id);this.save();}
    requestVerification(farm,district){const u=this.need('farmer');if(String(farm).trim().length<2||String(district).trim().length<2)fail('Enter the farm name and district.');u.verification={farm:String(farm).trim().slice(0,80),district:String(district).trim().slice(0,80),status:'Pending review',submitted:now()};this.save();}
    withdrawVerification(){const u=this.need('farmer');u.verification=null;this.save();}
    review(orderId,rating,text){const u=this.need('buyer');const o=this.order(orderId);if(o.status!=='Delivered')fail('Reviews are available after delivery.');rating=Number(rating);if(!Number.isInteger(rating)||rating<1||rating>5)fail('Choose a rating from 1 to 5.');const r=this.state.reviews.find(r=>r.orderId===orderId&&r.userId===u.id);const data={orderId,userId:u.id,rating,text:String(text).trim().slice(0,500),updated:now()};if(r)Object.assign(r,data);else this.state.reviews.push({id:this.id('REV'),...data});this.save();}
    deleteReview(orderId){const u=this.need('buyer');this.state.reviews=this.state.reviews.filter(r=>!(r.orderId===orderId&&r.userId===u.id));this.save();}
    exportData(){this.need();const s=clone(this.state);s.accounts=s.accounts.map(a=>this.safeUser(a));return s;}
  }
  const API={Service,digest,statuses,DELIVERY,seed};
  if(typeof module!=='undefined'&&module.exports)module.exports=API;root.AgriDomain=API;
})(typeof window!=='undefined'?window:globalThis);
