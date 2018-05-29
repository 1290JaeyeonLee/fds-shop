import axios from 'axios';

const shopAPI = axios.create({
  baseURL : process.env.API_URL
});

const memberEl = document.querySelector('.member');
const contEl = document.querySelector('.content');

const templates = {
  member: document.querySelector('#member').content,
  login: document.querySelector('#login').content,
  join: document.querySelector('#join').content,
  productList: document.querySelector('#product-list').content,
  productItem: document.querySelector('#product-item').content,
  productDetails: document.querySelector('#product-details').content
}

function login(token) {
  localStorage.setItem('token', token);
  shopAPI.defaults.headers['Authorization'] = `Bearer ${token}`;
  memberEl.classList.add('authed');
}
function logout() {
  localStorage.removeItem('token');
  delete shopAPI.defaults.headers['Authorization'];
  memberEl.classList.remove('authed');
}

function memberRender(fragment){
  memberEl.textContent = '';
  memberEl.appendChild(fragment);
}
function render(fragment){
  contEl.textContent = '';
  contEl.appendChild(fragment);
}

// 인덱스 페이지
async function indexPage() {
  memberInfo();
  listPage();
}

// 헤더 버튼 모음
async function memberInfo() {
  const frag = document.importNode(templates.member, true);
  frag.querySelector('.member__btn-login').addEventListener('click', e => {
    loginPage();
  })
  frag.querySelector('.member__btn-logout').addEventListener('click', e => {
    logout();
  })
  frag.querySelector('.member__btn-join').addEventListener('click', e => {
    joinPage();
  })
  memberRender(frag);
}
// 로그인 페이지
async function loginPage() {
  const frag = document.importNode(templates.login, true);
  const formEl = frag.querySelector('.login__form');
  formEl.addEventListener('submit', async e => {
    e.preventDefault();
    const payload = {
      username: e.target.elements.username.value,
      password: e.target.elements.password.value
    };
    const res = await shopAPI.post('/users/login', payload);
    if(res.status === 400){
      alert("아이디 또는 비밀번호가 올바르지 않습니다. 다시 확인하시고 입력해 주세요.");
      res.redirect('/');
      loginPage();
    } else{
      login(res.data.token);
      indexPage();
    }
  })
  frag.querySelector('.login__join-btn').addEventListener('click', e => {
    joinPage();
  })
  render(frag);
}

// 회원가입 페이지
async function joinPage() {
  const frag = document.importNode(templates.join, true);
  const formEl = frag.querySelector('.join__form');
  formEl.addEventListener('submit', async e => {
    e.preventDefault();
    const payload = {
      username: e.target.elements.username.value,
      password: e.target.elements.password.value,
      name: e.target.elements.name.value,
      address: e.target.elements.address.value,
      phone: e.target.elements.phone.value
    };
    const res = await shopAPI.post('/users/register', payload);
    indexPage();
  })
  render(frag);
}

// 상품 목록 페이지
async function listPage() {
  const res = await shopAPI.get('/products');
  const listFrag = document.importNode(templates.productList, true)
  const resReverse = res.data.reverse();
  resReverse.forEach(product => {
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
  const sizeEl = frag.querySelector('.product-details__size-select');
  if (res.data.sizes.length > 0){
    for(let i = 0; i < res.data.sizes.length; i++) {
      const optEl = document.createElement('option');
      optEl.setAttribute('value', res.data.sizes[i]);
      const valEl = document.createTextNode(res.data.sizes[i]);
      optEl.appendChild(valEl);
      sizeEl.appendChild(optEl);
    }
  }  
  const contentEl = frag.querySelector('.product-details__content');
  contentEl.textContent = res.data.content;    
  frag.querySelector('.product-details__btn-list').addEventListener('click', e => {
    indexPage();
  })
  render(frag);
}

document.querySelector('.header__heading').addEventListener('click', e => {
  indexPage();
})
indexPage();