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
const sectionDeals = document.querySelector('#deals');
const spanNbDeals = document.querySelector('#nbDeals');
const spanNbSales = document.querySelector('#nbSales');
const sectionSales = document.querySelector('#sales');
const spanavgSalesPrice = document.querySelector('#avgSalesPrice');
const spanp5Sales = document.querySelector('#p5Sales');
const spanp25Sales = document.querySelector('#p25Sales');
const spanp50Sales = document.querySelector('#p50Sales');
const spanlifetimeValue = document.querySelector("#lifetime-value");






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
      const isFavorite = localStorage.getItem(`favorite-${deal.id}`) ? '#CD7F32' : 'gray';
      return `
      <div class="deal" id=${deal.uuid}>
        <img src="${deal.photo}" alt="Deal Image"/>
        <div style="display: flex; flex-direction: column; gap: 10px;">
        <div class="id-star-container">
            <span>ID: ${deal.id}</span>
            <span class="favorite-star" data-id="${deal.id}" style="color: ${isFavorite}; cursor: pointer;">&#9733;</span>
          </div>
          <!-- Start Feature 11 and 12 -->
          <a href="${deal.link}" target="_blank">${deal.title}</a>
          <!-- End -->
          <span>${"Price : "}${deal.price}€</span>
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
  document.querySelectorAll('.favorite-star').forEach(star => {
    star.addEventListener('click', toggleFavorite);
  });
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
  const filteredDeals = currentDeals.filter(deal => deal.discount > 50);
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
 Feature 5 - Sort by price/ Feature 6 - Sort by date
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

  
  setCurrentDeals({ result: sortedDeals, meta: currentPagination });
  render(sortedDeals, currentPagination); 
}
function formatDateFromTimestamp(timestamp) {
  const date = new Date(timestamp * 1000); 

  const day = ('0' + date.getDate()).slice(-2); 
  const month = ('0' + (date.getMonth() + 1)).slice(-2); 
  const year = date.getFullYear(); 

  return `${day}/${month}/${year}`; 
}

/**
 Feature 7 and 8(and my understanding of feature 8)- Display Vinted sales and Specific indicators
 */
 // Fetch sales for a specific Lego set ID
 const fetchSales = async (legoSetId) => {
  try {
    const response = await fetch(`https://lego-api-blue.vercel.app/sales?id=${legoSetId}`); 
    const body = await response.json();

    if (body.success !== true) {
      console.error(body);
      document.getElementById('nbSales').innerText='0';
      return[];
    }
    const salesArray = Array.isArray(body.data.result) ? body.data.result : [body.data.result];
    spanNbSales.innerHTML = salesArray.length;
    const averageDays = calculateAverageDaysBetweenSales(salesArray);
    if(averageDays == "Pas assez de données pour calculer la moyenne" )
    {

    }
    spanlifetimeValue.innerHTML = `${averageDays} days`;
   
    return body.data.result; 
  } catch (error) {
    console.error('Error fetching sales:', error);
    document.getElementById('nbSales').innerText = '0';
    console.error(error);
    return [];
  }
};

const renderSales = (sales) => {
  const salesArray = Array.isArray(sales) ? sales : [sales];

  const fragment = document.createDocumentFragment();
  const div = document.createElement('div');

  const template = salesArray
    .map(sale => {
      return `
      <div class="sale" id=${sale.uuid}>
        <div style="display: flex; flex-direction: column; gap: 10px;">
          <!-- Start Feature 11 and 12 -->
          <a href="${sale.link}" target="_blank">${sale.title}</a>
          <!-- End -->
          <span>${"Price: "}${sale.price}€</span>
          <span>${"Published: "}${formatDateFromTimestamp(sale.published)}</span>
        </div>
      </div>
      `;
      
    })
    .join('');

  div.innerHTML = template;
  fragment.appendChild(div);
  //Start Feature 8
  if(salesArray.length == 0){
    sectionSales.innerHTML = `<h2>Vinted Sales : no sales</h2>`;
    
  }else if(salesArray.length == 1){
    sectionSales.innerHTML = `<h2>Vinted Sales : ${salesArray.length} sale</h2>`;
  }
  else{
    sectionSales.innerHTML = `<h2>Vinted Sales : ${salesArray.length} sales</h2>`;
  }
  //End
  
  
  sectionSales.appendChild(fragment);
  //Start Feature 9
  spanavgSalesPrice.innerHTML = `${(calculatePriceStatistics(salesArray).average).toFixed(2)} €`;
  spanp5Sales.innerHTML = `${(calculatePriceStatistics(salesArray).p5).toFixed(2)} €`;
  spanp25Sales.innerHTML = `${(calculatePriceStatistics(salesArray).p25).toFixed(2)} €`;
  spanp50Sales.innerHTML = `${(calculatePriceStatistics(salesArray).p50).toFixed(2)} €`;
  //End
};

selectLegoSetIds.addEventListener('change', async (event) => {
  const selectedLegoSetId = event.target.value;
  const sales = await fetchSales(selectedLegoSetId);
  renderSales(sales);
});

/**
 Feature 9 - average, p25, p50 and p95 price value indicators
 */
 function calculatePriceStatistics(salesArray) {
  const prices = salesArray.map(sale => parseFloat(sale.price)); // Convert prices to float
  prices.sort((a, b) => a - b); // Sort prices in ascending order

  const average = prices.reduce((sum, price) => sum + price, 0) / salesArray.length; // Calculate average

  const p5 = calculatePercentile(prices, 5);
  const p25 = calculatePercentile(prices, 25);
  const p50 = calculatePercentile(prices, 50);

  return { average, p5, p25, p50 };
}

function calculatePercentile(arr, percentile) {
  const index = (percentile / 100) * arr.length;
  if (arr.length === 0) return 0; // Avoid division by zero
  return arr[Math.floor(index)]; // Return the value at the calculated index
}
/**
 * Feature 10 - Lifetime value
As a user for a given set id
I want to indicate the Lifetime value
So that I can understand how long a set exists on Vinted
 */

function calculateAverageDaysBetweenSales(sales) {
  if (sales.length < 2) {
    const givenDate = (sales.map(sale => sale.published)*1000); 
    const currentDate = new Date();
    const differenceInMs = currentDate - givenDate;
    const differenceInDays = differenceInMs / (1000 * 60 * 60 * 24);

  return Math.floor(differenceInDays);
  } else 
  {
    const publishedDates = sales.map(sale => sale.published);
    const sortedDates = publishedDates.sort((a, b) => a - b);
    let totalDaysBetweenSales = 0;
    let totalIntervals = 0;

    for (let i = 1; i < sortedDates.length; i++) {
      const firstSaleDate = new Date(sortedDates[i - 1] * 1000);
      const secondSaleDate = new Date(sortedDates[i] * 1000);
      const differenceInMs = secondSaleDate - firstSaleDate;
      const differenceInDays = differenceInMs / (1000 * 60 * 60 * 24);
      totalDaysBetweenSales += differenceInDays;
      totalIntervals++;
  }
  const averageDays = totalDaysBetweenSales / totalIntervals;

  return Math.round(averageDays); // Arrondir le résultat
  }
}

/**
 * Feature 11 - Open product link
As a user
I want to open deal link in a new page
So that I can buy the product easily
 */

/**
 * Feature 12 - Open sold item link
As a user
I want to open sold item link in a new page
So that I can understand the sold item easily
 */

/**
 * Feature 13 - Save as favorite
As a user
I want to save a deal as favorite
So that I can retreive this deal later
 */
function toggleFavorite(event) {
  const star = event.target;
  const dealId = star.getAttribute('data-id');
  
  // Vérifier si le deal est déjà dans les favoris
  if (localStorage.getItem(`favorite-${dealId}`)) {
    // Si oui, retirer des favoris
    localStorage.removeItem(`favorite-${dealId}`);
    star.style.color = 'gray'; // Rendre l'étoile grise
  } else {
    // Si non, ajouter aux favoris
    localStorage.setItem(`favorite-${dealId}`, 'true');
    star.style.color = '#CD7F32'; // Rendre l'étoile jaune
  }
}

/**
 * Feature 14 - Filter by favorite
As a user
I want to filter by favorite deals
So that I can load only my favorite deals
 */
const filterFavoriteBtn = document.getElementById('favorite-btn');
filterFavoriteBtn.addEventListener('click', favoriteFilter);
function favoriteFilter() {
  const favoriteDeals = currentDeals.filter(deal =>localStorage.getItem(`favorite-${deal.id}`));
  
  setCurrentDeals({ result: favoriteDeals, meta: currentPagination });
  render(favoriteDeals, currentPagination);
}