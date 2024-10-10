// Invoking strict mode https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Strict_mode#invoking_strict_mode
'use strict';

/**
Description of the available api
GET https://lego-api-blue.vercel.app/deals

Search for specific deals

This endpoint accepts the following optional query string parameters:

- `page` - page of deals to return
- `size` - number of deals to return

GET https://lego-api-blue.vercel.app/sales

Search for current Vinted sales for a given lego set id

This endpoint accepts the following optional query string parameters:

- `id` - lego set id to return
*/

// current deals on the page
let currentDeals = [];
let currentPagination = {};

// instantiate the selectors
const selectShow = document.querySelector('#show-select');
const selectPage = document.querySelector('#page-select');
const selectLegoSetIds = document.querySelector('#lego-set-id-select');
const sectionDeals= document.querySelector('#deals');
const spanNbDeals = document.querySelector('#nbDeals');

/**
 * Set global value
 * @param {Array} result - deals to display
 * @param {Object} meta - pagination meta info
 */
const setCurrentDeals = ({result, meta}) => {
  currentDeals = result;
  currentPagination = meta;
};

/**
 * Fetch deals from api
 * @param  {Number}  [page=1] - current page to fetch
 * @param  {Number}  [size=12] - size of the page
 * @return {Object}
 */
const fetchDeals = async (page = 1, size = 6) => {
  try {
    const response = await fetch(
      `https://lego-api-blue.vercel.app/deals?page=${page}&size=${size}`
    );
    const body = await response.json();

    if (body.success !== true) {
      console.error(body);
      return {currentDeals, currentPagination};
    }

    return body.data;
  } catch (error) {
    console.error(error);
    return {currentDeals, currentPagination};
  }
};

/**
 * Render list of deals
 * @param  {Array} deals
 */
const renderDeals = deals => {
  const fragment = document.createDocumentFragment();
  const div = document.createElement('div');
  const template = deals
    .map(deal => {
      return `
      <div class="deal" id=${deal.uuid}>
        <img src="${deal.photo}" alt="Deal Image"/>
        <div style="display: flex; flex-direction: column; gap: 10px;">
          <span>${"ID : "}${deal.id}</span>
          <a href="${deal.link}">${deal.title}</a>
          <span>${"Price : "}${deal.price}${"€"}</span>
          <span>${"Comments : "}${deal.comments}</span>
          <span>${"Hotness : "}${deal.temperature}${"°C"}</span>
          <span>${" Date : "}${formatDateFromTimestamp(deal.published)}</span>
        </div>
      </div>
    `;
    })
    .join('');

  div.innerHTML = template;
  fragment.appendChild(div);
  sectionDeals.innerHTML = '<h2>Deals</h2>';
  sectionDeals.appendChild(fragment);
};

/**
 * Render page selector
 * @param  {Object} pagination
 */
const renderPagination = pagination => {
  const {currentPage, pageCount} = pagination;
  const options = Array.from(
    {'length': pageCount},
    (value, index) => `<option value="${index + 1}">${index + 1}</option>`
  ).join('');

  selectPage.innerHTML = options;
  selectPage.selectedIndex = currentPage - 1;
};

/**
 * Render lego set ids selector
 * @param  {Array} lego set ids
 */
const renderLegoSetIds = deals => {
  const ids = getIdsFromDeals(deals);
  const options = ids.map(id => 
    `<option value="${id}">${id}</option>`
  ).join('');

  selectLegoSetIds.innerHTML = options;
};

/**
 * Render page selector
 * @param  {Object} pagination
 */
const renderIndicators = pagination => {
  const {count} = pagination;

  spanNbDeals.innerHTML = count;
};

const render = (deals, pagination) => {
  renderDeals(deals);
  renderPagination(pagination);
  renderIndicators(pagination);
  renderLegoSetIds(deals)
};

/**
 * Declaration of all Listeners
 */

/**
 * Select the number of deals to display
 */
selectShow.addEventListener('change', async (event) => {
  const deals = await fetchDeals(currentPagination.currentPage, parseInt(event.target.value));

  setCurrentDeals(deals);
  render(currentDeals, currentPagination);
});

document.addEventListener('DOMContentLoaded', async () => {
  const deals = await fetchDeals();

  setCurrentDeals(deals);
  render(currentDeals, currentPagination);
  
});

/**
 * Feature 1 - Browse pages
As a user
I want to browse available pages
So that I can load more deals
*/
selectPage.addEventListener('change', async (event) => {
  const selectedPage = parseInt(event.target.value);
  const deals = await fetchDeals(selectedPage, selectShow.value);
  setCurrentDeals(deals);
  render(currentDeals, currentPagination);
  
});

/**Feature 2 - Filter by best discount
As a user
I want to filter by best discount
So that I can browse deals with a discount more important than 50% */
const filterDiscountBtn = document.getElementById('filter-discount-btn');

filterDiscountBtn.addEventListener('click', handleDiscountFilter);
function handleDiscountFilter() {
  // 1. Filter deals with discount greater than 50%
  const filteredDeals = currentDeals.filter(deal => deal.discount > 50);

  // 2. Update currentDeals and render the filtered list
  setCurrentDeals({ result: filteredDeals, meta: currentPagination });
  render(filteredDeals, currentPagination);
}

/**Feature 3 - Filter by most commented
As a user
I want to filter by most commented deals
So that I can browse deals with more than 15 comments */
const mostCommentedBtn = document.getElementById('most-commented-btn');

mostCommentedBtn.addEventListener('click', handleMostCommented);
function handleMostCommented() {
 
  const mostCommented = currentDeals.filter(deal => deal.comments > 15);

  setCurrentDeals({ result: mostCommented, meta: currentPagination });
  render(mostCommented, currentPagination);
}

/**
 Feature 4 - Filter by hot deals
As a user
I want to filter by hot deals
So that I can browse deals with a temperature more important than 100
 */
const hotDealsBtn = document.getElementById('hot-deals-btn');

hotDealsBtn.addEventListener('click', handleHotDeals);
function handleHotDeals() {
 
  const hotDeals = currentDeals.filter(deal => deal.temperature > 100);

  setCurrentDeals({ result: hotDeals, meta: currentPagination });
  render(hotDeals, currentPagination);
}

/**
 Feature 5 - Sort by price/ Feature 5 - Sort by date
 As a user
I want to sort by price
So that I can easily identify cheapest and expensive deals
 */
const sortSelect= document.getElementById('sort-select');

sortSelect.addEventListener('change', (event) => {
  const selectedValue = event.target.value;
  sortDeals(selectedValue);
});

function sortDeals(criteria) {
  let sortedDeals;

  switch (criteria) {
    case 'price-asc': 
      sortedDeals = [...currentDeals].sort((a, b) => a.price - b.price);
      break;
    case 'price-desc': 
      sortedDeals = [...currentDeals].sort((a, b) => b.price - a.price);
      break;
    case 'date-asc':
      sortedDeals = [...currentDeals].sort((a, b) => new Date(b.published) - new Date(a.published));
      break;
    case 'date-desc': 
      sortedDeals = [...currentDeals].sort((a, b) =>new Date(a.published) - new Date(b.published) ); 
      break;
    default:
      sortedDeals = currentDeals; 
  }

  // Met à jour les offres actuelles après le tri
  setCurrentDeals({ result: sortedDeals, meta: currentPagination });
  render(sortedDeals, currentPagination); // Mets à jour l'affichage
}
function formatDateFromTimestamp(timestamp) {
  const date = new Date(timestamp * 1000); // Multiplier par 1000 si le timestamp est en secondes

  const day = ('0' + date.getDate()).slice(-2); // Récupère le jour avec un 0 en préfixe si nécessaire
  const month = ('0' + (date.getMonth() + 1)).slice(-2); // Les mois commencent à 0 donc on ajoute 1
  const year = date.getFullYear(); // Récupère l'année

  return `${day}/${month}/${year}`; // Retourne la date formatée
}
