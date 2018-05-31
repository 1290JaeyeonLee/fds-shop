import axios from 'axios';

const shopAPI = axios.create({
  baseURL : process.env.API_URL,
  validateStatus: () => true,
});

const memberEl = document.querySelector('.member');
const contEl = document.querySelector('.content');

const templates = {
  member: document.querySelector('#member').content,
  login: document.querySelector('#login').content,
  join: document.querySelector('#join').content,
  productList: document.querySelector('#product-list').content,
  productItem: document.querySelector('#product-item').content,
  productDetails: document.querySelector('#product-details').content,
  productLayer: document.querySelector('#product-layer').content,
  cart: document.querySelector('#cart').content,
  cartItem: document.querySelector('#cart-item').content,
  cartNoItem: document.querySelector('#cart-noitem').content
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
  if(memberEl.classList.contains('authed')){
    frag.querySelector('.member__btn-logout').addEventListener('click', e => {
      logout();
      indexPage();
    })
    frag.querySelector('.member__btn-cart').addEventListener('click', e => {
      cartPage();
    })
    // frag.querySelector('.member__btn-logout').addEventListener('click', e => {
    //   logout();
    // })
  } else {
    frag.querySelector('.member__btn-login').addEventListener('click', e => {
      loginPage();
    })
    
    frag.querySelector('.member__btn-join').addEventListener('click', e => {
      joinPage();
    })
  }
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
    } else {
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
      password: e.target.elements.password.value
    };
    const res = await shopAPI.post('/users/register', payload);
    login(res.data.token)
    const meRes = await shopAPI.get('/me');
    const payloadMore = {
      name: e.target.elements.name.value,
      address: e.target.elements.address.value,
      phone: e.target.elements.phone.value
    };
    const resMore = await shopAPI.patch(`/users/${meRes.data.id}`, payloadMore);
    
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

// 상품 상세 페이지
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
  const layerEl = frag.querySelector('.product-details__layer');  
  const totalEl = frag.querySelector('.product-details__total-num');
  let countPrice = 0;

  const items = [];

  sizeEl.addEventListener('change', e => {
    e.preventDefault();
    if(e.target.value !== '사이즈 선택'){
      // 상품 선택 시 나타나는 레이어
      const layerFrag = document.importNode(templates.productLayer, true);

      const layerListEl = frag.querySelector('.product-details__layer__list');
      const layerSizeEl = layerFrag.querySelector('.product-details__layer__size');
      const layerPriceEl = layerFrag.querySelector('.product-details__layer__num');
      const layerDelEl = layerFrag.querySelector('.product-details__layer__del');
      const quantityEl = layerFrag.querySelector('.product-details__quantity-total');
      const minusEl = layerFrag.querySelector('.product-details__quantity-minus');
      const plusEl = layerFrag.querySelector('.product-details__quantity-plus');
  
      let quantityValue = quantityEl.getAttribute('value');
      quantityEl.setAttribute('value', 1);



      layerEl.classList.add('layer-active');
      const productPrice = parseInt(priceEl.textContent); 
      const item = {
        size: e.target.value,
        quantity: parseInt(quantityValue),
        price: productPrice
      }

      layerSizeEl.textContent = item.size;      
      layerPriceEl.textContent = item.price; 
      let layerPrice = item.price; 
      
      // 상품 금액 총합계
      const layerNum = layerFrag.querySelector('.product-details__layer__num').textContent;
      countPrice += parseInt(layerNum);
      totalEl.textContent = countPrice;
      

      // 수량 버튼
      minusEl.addEventListener('click', e => {
        e.preventDefault();  
        if (quantityValue <= 1) {
          alert('수량은 1개 이상만 선택 가능합니다.');
        } else {
          quantityValue--;
          quantityEl.setAttribute('value', quantityValue);
          item.quantity--;

          layerPrice = productPrice * quantityValue;
          item.price = layerPrice;
          layerPriceEl.textContent = item.price;
          
          countPrice -= parseInt(productPrice);
          totalEl.textContent = countPrice;
        }
      })
      plusEl.addEventListener('click', e => {
        e.preventDefault();
        quantityValue++;
        quantityEl.setAttribute('value', quantityValue);
        item.quantity++;

        layerPrice = productPrice * quantityValue;
        item.price = layerPrice;
        layerPriceEl.textContent = item.price;

        countPrice += parseInt(productPrice);
        totalEl.textContent = countPrice; 
      })
      items.push(item);

      // 삭제 버튼
      layerDelEl.addEventListener('click', e => {
        e.preventDefault();
        let count = 0;
        for(let i = 0; i < e.target.parentNode.parentNode.childNodes.length; i++) {
          if (e.target.parentNode.parentNode.childNodes[i].nodeType === 1) {
            count++;
            if (e.target.parentNode.parentNode.childNodes[i] === e.target.parentNode) {
              break;
            }
          }
        }
        items.splice(count-1, 1);
        e.target.parentNode.remove();
        
        let delPrice = 0;
        delPrice = parseInt(e.target.previousElementSibling.firstElementChild.textContent);
        countPrice -= delPrice;
        totalEl.textContent = countPrice;
      
        if(!layerEl.hasChildNodes()) {
          layerEl.classList.remove('layer-active');
        }
      })
    layerEl.appendChild(layerFrag);
    }
  })
  
  const contentEl = frag.querySelector('.product-details__content');
  contentEl.textContent = res.data.content;    
  frag.querySelector('.product-details__btn-list').addEventListener('click', e => {
    indexPage();
  })

  frag.querySelector('.product-details__btn-cart').addEventListener('click', async e => {
    e.preventDefault();
    const payload = {
      size : 0,
      quantity : 0,
      price: 0,
      productId : productId
    } 
    for(let i = 0; i < items.length; i++){
      payload.size = items[i].size;
      payload.quantity = items[i].quantity;      
      payload.price = items[i].price;

      const cartRes = await shopAPI.post('/carts', payload);
      cartPage();
    } 
  })
  render(frag);
}


async function cartPage(){
  const res = await shopAPI.get('/carts?_expand=product');
  const frag = document.importNode(templates.cart, true);
  console.log(res.data);
  render(frag);
}


document.querySelector('.header__heading').addEventListener('click', e => {
  indexPage();
})

if(localStorage.getItem('token')){
  login(localStorage.getItem('token'));
}

indexPage();