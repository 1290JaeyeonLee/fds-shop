import axios from 'axios';

const shopAPI = axios.create({
  baseURL : process.env.API_URL,
  validateStatus: () => true,
});


const memberEl = document.querySelector('.member');
const contEl = document.querySelector('.content');

shopAPI.interceptors.request.use(function (config) {
  contEl.classList.add('cont--loading');
  return config;
});
shopAPI.interceptors.response.use(function (response) {
  contEl.classList.remove('cont--loading');
  return response;
})

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
  cartNoItem: document.querySelector('#cart-noitem').content,
  order: document.querySelector('#order').content,
  orderList: document.querySelector('#order-list').content,
  orderShip: document.querySelector('#order-ship').content,
  orderHistory: document.querySelector('#order-history').content,
  orderHisList: document.querySelector('#order-history__list').content,
  orderHisNoList: document.querySelector('#order-history__nolist').content,      
  orderProduct: document.querySelector('#order-product').content  
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
    frag.querySelector('.member__btn-order').addEventListener('click', e => {
      historyPage()
    })
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
  frag.querySelector('.product-details__btn-golist').addEventListener('click', e => {
    indexPage();
  })

  frag.querySelector('.product-details__btn-cart').addEventListener('click', async e => {
    e.preventDefault();
    if(!layerEl.hasChildNodes()) {
      alert('옵션을 선택해주세요.')
    }
    if(memberEl.classList.contains('authed')){
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
    } else {
      alert('로그인 후 이용해주세요.');
      loginPage();
    } 
  })

  frag.querySelector('.product-details__btn-buy').addEventListener('click', async e => {
    e.preventDefault();
    if(!layerEl.hasChildNodes()) {
      alert('옵션을 선택해주세요.')
    }
    if(memberEl.classList.contains('authed')){
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
        noCart();
      }
    } else {
      alert('로그인 후 이용해주세요.');
      loginPage();
    } 
  })

  render(frag);
}
// 바로구매
async function noCart(){
  const res = await shopAPI.get('/carts?_expand=product');  
  orderPage(res.data.map(cart => cart.id));
}

// 장바구니 페이지
async function cartPage(){
  const res = await shopAPI.get('/carts?_expand=product');
  const frag = document.importNode(templates.cart, true);
  const orderBtnEl = frag.querySelector('.cart__total__order');
  let countPrice = 0;
  if(res.data.length === 0){
    const cartFrag = document.importNode(templates.cartNoItem, true);
    frag.querySelector('.cart__list').appendChild(cartFrag);
  } else {
    res.data.forEach((cart, index, carts) => {
      const cartFrag = document.importNode(templates.cartItem, true);
      const imgEl = cartFrag.querySelector('.cart__item__img');
      imgEl.setAttribute('src', cart.product.img);
      const titleEl = cartFrag.querySelector('.cart__item__title');
      titleEl.textContent = cart.product.product;
      const sizeEl = cartFrag.querySelector('.cart__item__size');
      sizeEl.textContent = cart.size;
      const quantityEl = cartFrag.querySelector('.cart__item__quantity-total');
      const minusEl = cartFrag.querySelector('.cart__item__quantity-minus');
      const plusEl = cartFrag.querySelector('.cart__item__quantity-plus');
      quantityEl.setAttribute('value', cart.quantity);
      const delEl = cartFrag.querySelector('.cart__item__btn-delete');
      const priceEl = cartFrag.querySelector('.cart__item__price');
      priceEl.textContent = cart.price;
      let productPrice = parseInt(cart.product.price); 
      let itemPrice = productPrice;
      countPrice += parseInt(cart.price);
      let quantityValue = quantityEl.getAttribute('value');
      const totalPriceEl = frag.querySelector('.cart__total__price-num');
      const payEl = frag.querySelector('.cart__item__btn-order');
      
      // 수량 버튼
      minusEl.addEventListener('click', async e => {
        e.preventDefault();  
        if (quantityValue <= 1) {
          alert('수량은 1개 이상만 선택 가능합니다.');
        } else {
          quantityValue--;
          quantityEl.setAttribute('value', quantityValue);
          countPrice -= parseInt(productPrice);
          totalPriceEl.textContent = countPrice;

          itemPrice = productPrice * quantityValue;
          priceEl.textContent = itemPrice;
          cart.quantity--;
          cart.price = itemPrice;
          const payload = {
            quantity: cart.quantity,
            price: cart.price
          };
          const resCart = await shopAPI.patch(`/carts/${cart.id}`, payload);  
        }
      })
      plusEl.addEventListener('click', async e => {
        e.preventDefault();
        quantityValue++;
        quantityEl.setAttribute('value', quantityValue);
        countPrice += parseInt(productPrice);
        totalPriceEl.textContent = countPrice;

        itemPrice = productPrice * quantityValue;
        priceEl.textContent = itemPrice;
        cart.quantity++;
        cart.price = itemPrice;
        const payload = {
          quantity: cart.quantity,
          price: cart.price
        };
        const resCart = await shopAPI.patch(`/carts/${cart.id}`, payload);          
      })
 
      // 삭제 버튼
      delEl.addEventListener('click', async e => {
        e.preventDefault();
        e.target.parentNode.parentNode.remove();
        carts.splice(index, 1);
        const cartRes = await shopAPI.delete(`/carts/${cart.id}`);      
        let delPrice = 0;
        delPrice = cart.price;
        countPrice -= delPrice;
        totalPriceEl.textContent = countPrice;      
      })
      totalPriceEl.textContent = countPrice;
      frag.querySelector('.cart__list').appendChild(cartFrag);
    })
    payEl.addEventListener('click', async e => {
      e.preventDefault();
    })
  }
  orderBtnEl.addEventListener('click', async e => {
    e.preventDefault();
    orderPage(res.data.map(cart => cart.id));
  })
  render(frag);
}

// 주문 결제 페이지
async function orderPage(cartIds){
  const carts = [];

  for (const cartId of cartIds) {
    const res = await shopAPI.get(`/carts/${cartId}?_expand=product`);
    carts.push(res.data);
  }

  const frag = document.importNode(templates.order, true);
  const orderListEl = frag.querySelector('.order__list');
  const orderShipEl = frag.querySelector('.order__ship');
  const totalPay = frag.querySelector('.order__pay__price-num');
  const payBtnEl = frag.querySelector('.order__pay__btn');

  let countPrice = 0;
  carts.forEach(order => {
    const orderFrag = document.importNode(templates.orderList, true);
    const imgEl = orderFrag.querySelector('.order__item__img');
    imgEl.setAttribute('src', order.product.img);
    const titleEl = orderFrag.querySelector('.order__item__title');
    titleEl.textContent = order.product.product;
    const sizeEl = orderFrag.querySelector('.order__item__size');
    sizeEl.textContent = order.size;
    const quantityEl = orderFrag.querySelector('.order__item__quantity');
    quantityEl.textContent = order.quantity;
    const priceEl = orderFrag.querySelector('.order__item__price');
    priceEl.textContent = order.price;
    countPrice += order.price;
    orderListEl.appendChild(orderFrag);
  })
  totalPay.textContent = countPrice;
  
  const userRes = await shopAPI.get(`/carts?_expand=user`);
  const shipFrag = document.importNode(templates.orderShip, true);
  userRes.data.forEach(user => {
    const orderShipBox = shipFrag.querySelector('.order__ship__box');
    const orderShipName = shipFrag.querySelector('#order__ship__name');
    orderShipName.setAttribute('value', user.user.name);
    const orderShipAddress = shipFrag.querySelector('#order__ship__address');
    orderShipAddress.setAttribute('value', user.user.address);
    const orderShipPhone = shipFrag.querySelector('#order__ship__phone');
    orderShipPhone.setAttribute('value', user.user.phone);
  })
  orderShipEl.appendChild(shipFrag);

  payBtnEl.addEventListener('click', async e => {
    e.preventDefault();
    alert('결제가 완료되었습니다.');
    const payDate = new Date();

    const payload = {
      orderItems : [],
      date: payDate.toLocaleString,
      payTotal: countPrice
    }

    carts.forEach(cart => {
      let orderItem = {
        size : cart.size,
        quantity : cart.quantity,      
        price : cart.price,
        productId : cart.productId
      }
      console.log(payload)
      payload.orderItems.push(orderItem);
    });
    console.log(payload)
    const orderRes = await shopAPI.post('/orders', payload);
    historyPage();
  })
  render(frag);
}

// 주문내역 페이지
async function historyPage(){
  //const cartDel = await shopAPI.delete('/carts');
  const res = await shopAPI.get('/orders');

  console.log(res.data)
  const frag = document.importNode(templates.orderHistory, true);
  const historyListEl = frag.querySelector('.order-history__list');
  if(res.data.length === 0){
    const orderFrag = document.importNode(templates.orderHisNoList, true);
    historyListEl.appendChild(orderFrag);
  } else {
    res.data.forEach(async order => {
      const orderFrag = document.importNode(templates.  orderHisList, true);
      const orderNumEl = orderFrag.querySelector('.order-history__number');
      orderNumEl.textContent = order.id;
      const dateEl = orderFrag.querySelector('.order-history__date');
      dateEl.textContent = order.date;
      const priceEl = orderFrag.querySelector('.order-history__total');
      priceEl.textContent = order.payTotal;
      const itemListEl = orderFrag.querySelector('.order-history__products');
      historyListEl.appendChild(orderFrag);
    });
  }
  render(frag);
}

document.querySelector('.header__heading').addEventListener('click', e => {
  indexPage();
})

if(localStorage.getItem('token')){
  login(localStorage.getItem('token'));
}

indexPage();