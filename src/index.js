import axios from 'axios';

const shopAPI = axios.create({
  baseURL : process.env.API_URL
});


const contEl = document.querySelector('.container');

const templates = {
  member: document.querySelector('#member').content,
  productList: document.querySelector('#product-list').content,
  productItem: document.querySelector('#product-item').content,
  productDetails: document.querySelector('#product-details').content
}


function render(fragment){
  contEl.textContent = '';
  contEl.appendChild(fragment);
}

// 인덱스 페이지
async function indexPage() {
  listPage();
}

async function memberInfo() {
  const frag = document.importNode(templates.member, true);
  const memberEl = frag.querySelector('.member__btn');
  // 클릭
  render(frag);
}

// 상품 목록 페이지
async function listPage() {
  const res = await shopAPI.get('/products');
  const listFrag = document.importNode(templates.productList, true)

  res.data.forEach(product => {
    const frag = document.importNode(templates.productItem, true);
    const imgEl = frag.querySelector('.product-item__img');
    imgEl.setAttribute('src', product.img);
    imgEl.setAttribute('alt', product.product);
    const titleEl = frag.querySelector('.product-item__title');
    titleEl.textContent = product.product;
    const priceEl = frag.querySelector('.product-item__price');
    priceEl.textContent = product.price;     
    
    imgEl.addEventListener('click', e => {
      contentPage(product.id)
    });
    titleEl.addEventListener('click', e => {
      contentPage(product.id)
    });
    listFrag.querySelector('.product-list').appendChild(frag);
  });
  render(listFrag);
}

async function contentPage(productId){
  const res = await shopAPI.get(`/products/${productId}`);
  const frag = document.importNode(templates.productDetails, true);
  const imgEl = frag.querySelector('.product-details__img');
  imgEl.setAttribute('src', res.data.img);
  imgEl.setAttribute('alt', res.data.product);
  const titleEl = frag.querySelector('.product-details__title');
  titleEl.textContent = res.data.product;
  const priceEl = frag.querySelector('.product-details__price');
  priceEl.textContent = res.data.price;  
  const contentEl = frag.querySelector('.product-details__content');
  contentEl.textContent = res.data.content;    
  frag.querySelector('.product-details__btn-list').addEventListener('click', e => {
    indexPage();
  })
  render(frag);
}





indexPage();