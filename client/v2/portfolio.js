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
 * @param {Array} deals - deals to display
 * @param {Object} meta - pagination meta info
 */
const setCurrentDeals = ({deals, meta}) => {
  currentDeals = deals;
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
      `https://legoprofit.vercel.app/deals?page=${page}&size=${size}`
    );
    const body = await response.json();

    if (!body.meta || !body.deals) {
      console.error(body);
      return {currentDeals, currentPagination};
    }

    return {deals: body.deals, meta: body.meta};
  } catch (error) {
    console.error(error);
    return {currentDeals, currentPagination};
  }
};
function setLoadingCursor() {
  document.body.style.cursor = 'wait';
}

function resetCursor() {
  document.body.style.cursor = 'default';
}

/**
 * Render list of deals
 * @param  {Array} deals
 */
const renderDeals = (deals) => {
  // Conteneur principal
  const fragment = document.createDocumentFragment();

  // Ajout d'une classe CSS pour le layout
  sectionDeals.innerHTML = '<h2>Deals</h2>';
  const gridContainer = document.createElement('div');
  gridContainer.className = 'grid-container';

  // Génération des cartes pour chaque deal
  deals.forEach((deal) => {
    const isFavorite = localStorage.getItem(`favorite-${deal.legoId}`) ? '#CD7F32' : 'gray';

    // Création de la carte
    const dealCard = document.createElement('div');
    dealCard.className = 'deal';
    dealCard.id = deal._id;
    const getHotnessColor = (temperature) => {
      if (temperature > 200) return "red";
      if (temperature > 99) return "orange";
      if (temperature > 50) return "#45a049";
      return "blue";
    };
    dealCard.innerHTML = `
      <img src="${deal.imgUrl}" alt="${deal.title}" />
      <div style="display: flex; flex-direction: column; gap: 10px;">
        <div class="id-star-container">
          <span style="display: none;">ID: ${deal.legoId}</span>
          <span class="favorite-star" deals-id="${deal.legoId}" style="color: ${isFavorite}; cursor: pointer;font-size: 30px;">&#9733;</span>
        </div>
        <a href="${deal.linkDL}" target="_blank">${deal.title}</a>
        
       <div style="display: flex; align-items: center; justify-content: space-between;">
          <div style="display: flex; align-items: center; gap: 10px;">
            <span style="color: #ee1010; font-weight: bold; font-size: 1.2em;">${deal.price}€</span>
            <span style="text-decoration: line-through; color: gray;">${deal.basePrice}€</span>
           <span style="color:rgb(252, 113, 0); font-weight: bold;">${deal.discount}%</span>
          </div>
          <span class="hotness" style="color: ${getHotnessColor(deal.temperature)}; font-weight: bold;font-size: 15px;">
        ${deal.temperature}°C
      </span>
        </div>
       <span style="display: none;"> price: ${deal.price} €</span> 
        <span style="display: none;">Comments: ${deal.comments}</span>
        <span style="display: none;">Hotness: ${deal.temperature}°C</span>
        <span>${formatDateFromTimestamp(deal.published)}</span>
      </div>
    `;
 
    // Ajout de la carte au conteneur
    gridContainer.appendChild(dealCard);
  });
 

  // Ajout du conteneur au fragment
  fragment.appendChild(gridContainer);

  // Ajout du fragment à la section
  sectionDeals.appendChild(fragment);
  sectionDeals.addEventListener("click", handleDealClick);
  // Ajout des gestionnaires d'événements pour les étoiles favorites
  document.querySelectorAll('.favorite-star').forEach((star) => {
    star.addEventListener('click', toggleFavorite);
  });
};


/**
 * Render page selector
 * @param  {Object} pagination
 */
const renderPagination = pagination => {
  const {page, totalPages} = pagination;
  const options = Array.from(
    {'length': totalPages},
    (value, index) => `<option value="${index + 1}">${index + 1}</option>`
  ).join('');

  selectPage.innerHTML = options;
  selectPage.selectedIndex = page - 1;
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

 
};

/**
 * Render page selector
 * @param  {Object} pagination
 */
const renderIndicators = pagination => {
  const {total} = pagination;

  spanNbDeals.innerHTML = total;
};

const render = (deals, pagination) => {
  renderDeals(deals);
  renderPagination(pagination);
  renderIndicators(pagination);
  renderLegoSetIds(deals)
};
function handleDealClick(event) {
  // On s'assure que l'on clique sur un élément contenant les informations du deal
  const dealCard = event.target.closest('.deal'); // Récupère le parent .deal de l'élément cliqué

  if (!dealCard) return; // Si le clic n'est pas sur un deal, on ne fait rien

  // Récupération des informations depuis le DOM
  const deal = {
    legoId: dealCard.querySelector(".id-star-container span").textContent.split(": ")[1],
    title: dealCard.querySelector("a").textContent,
    link: dealCard.querySelector("a").href,
    price: dealCard.querySelector("span:nth-child(4)").textContent.split(": ")[1],
    comments: dealCard.querySelector("span:nth-child(5)").textContent.split(": ")[1],
    temperature: dealCard.querySelector("span:nth-child(6)").textContent.split(": ")[1],
    date: dealCard.querySelector("span:nth-child(7)").textContent,
  };

  // Exemple de ventes associées (remplacez par des données dynamiques si possible)
  fetchSales(deal.legoId).then((sales) => {
  
    showDealPopup(deal, sales);

  });
}
const evaluateDeal = (dealPrice, numberOfSales, 
  averagePrice, 
  p5, 
  p25, 
  p50, 
  lifetimeValue) => {
    let score = 0;
    let colorClass = 0;
  // Évaluation par rapport aux percentiles
  if (dealPrice < p5) {
    score += 3; // 3 points pour un prix très bas
  } else if (dealPrice < p25) {
    score += 2; // 2 points pour un prix sous le P25
  } else if (dealPrice < p50) {
    score += 1; // 1 point pour un prix sous le P50
  } else {
    score += 0; // 0 point si le prix est supérieur à P50
  }

  // Évaluation par rapport au prix moyen
  if (dealPrice < averagePrice) {
    score += 2; // 2 points si le prix est inférieur à la moyenne
  } else {
    score += 0; // 0 point si le prix est supérieur ou égal à la moyenne
  }

  // Évaluation par rapport à la Lifetime Value
  if (lifetimeValue <= 10) {
    score += 3; // 3 points pour une vente rapide
  } else if (lifetimeValue <= 30) {
    score += 2; // 2 points pour une vente moyenne
  } else {
    score += 1; // 1 point pour une vente lente
  }

  // Évaluation par rapport au nombre de ventes
  if (numberOfSales > 20) {
    score += 3; // 3 points pour un grand nombre de ventes (produit populaire)
  } else if (numberOfSales >= 10) {
    score += 2; // 2 points pour un nombre de ventes moyen
  } else if (numberOfSales >= 5) {
    score += 1; // 1 point pour un nombre de ventes faible mais acceptable
  } else {
    score += 0; // 0 point si le nombre de ventes est trop bas
  }

  // Calcul du score final
  let scoreMessage = '';
  if (score >= 9) {
    scoreMessage = 'Excellent Deal !';
    colorClass = '#45a049';
  } else if (score >= 7) {
    scoreMessage = 'Good Deal !';
    colorClass = 'blue';
  } else if (score >= 5) {
    scoreMessage = 'Average Deal';
    colorClass = '#ffcc00';
  } else {
    scoreMessage = 'Not An Interesting Deal';
    colorClass = 'red';
  }

  return { score, scoreMessage,colorClass };
};


// Affiche une pop-up avec les informations du deal
function showDealPopup(deal, sales) {
  // Contenu de la pop-up
  const salesArray = Array.isArray(sales) ? sales : [sales];
  const evaluation = evaluateDeal(deal.price,sales.length, 
    (calculatePriceStatistics(salesArray).average).toFixed(2), 
    (calculatePriceStatistics(salesArray).p5).toFixed(2), 
    (calculatePriceStatistics(salesArray).p25).toFixed(2), 
    (calculatePriceStatistics(salesArray).p50).toFixed(2), 
    calculateAverageDaysBetweenSales(salesArray));
  const popupContent = `
    <h2>${deal.title} - <span style="color:${evaluation.colorClass}">${evaluation.scoreMessage}</h2>
    <p><strong>Lego set n°</strong> ${deal.legoId}</p>
    <p><strong>Price:</strong> ${deal.price}</p>
    <p><strong>Comments:</strong> ${deal.comments}</p>
    <p><strong>Hotness:</strong> ${deal.temperature}</p>
    <p><strong>Date:</strong> ${deal.date}</p>
    <p><strong>Deal's Score : </strong><span style="color:${evaluation.colorClass}">${evaluation.score}</p>
    
    
      <!-- Section Indicators -->
    
      <h3>Indicators</h3>
      <div>
        <span>Number of sales : </span>
        <span id="nbSales">${sales.length}</span>
      </div>
      <div>
        <span>Average sales price : </span>
        <span id="avgSalesPrice">${(calculatePriceStatistics(salesArray).average).toFixed(2)} €</span>
      </div>
      <div>
        <span>p5 sales price value : </span>
        <span id="p5Sales">${(calculatePriceStatistics(salesArray).p5).toFixed(2)} €</span>
      </div>
      <div>
        <span>p25 sales price value : </span>
        <span id="p25Sales">${(calculatePriceStatistics(salesArray).p25).toFixed(2)} €</span>
      </div>
      <div>
        <span>p50 sales price value : </span>
        <span id="p50Sales">${(calculatePriceStatistics(salesArray).p50).toFixed(2)} €</span>
      </div>
      <div>
        <span>Lifetime value : </span>
        <span id="lifetime-value">${calculateAverageDaysBetweenSales(salesArray)} days</span>
      </div>
 
    <br>
    <h2>Sales Data (Vinted)</h2>
<div class="sales-cards-container">
  ${sales.length > 0
    ? sales
        .map(
          sale => `
          <div class="sales-card">
            <h4><a href="${sale.itemURL}" target="_blank">${sale.title}</a>
            </h4>
            <p><strong>Price:</strong> ${sale.price}€</p>
            <p><strong>Date:</strong> ${formatDateFromTimestamp(sale.published)}</p>
          </div>`
        )
        .join("")
    : "<p>No sales available</p>"}
</div>
    <button class="close-btn" onclick="closePopup()">Close</button>

     
  `;

  // Injecte le contenu et affiche la pop-up
  const popup = document.querySelector(".popup");
  popup.querySelector(".popup-content").innerHTML = popupContent;
  popup.style.display = "flex";
}

// Ferme la pop-up
function closePopup() {
  document.querySelector(".popup").style.display = "none";
}

/**
 * Declaration of all Listeners
 */

/**
 * Select the number of deals to display
 */
selectShow.addEventListener('change', async (event) => {
  const deals = await fetchDeals(currentPagination.page, parseInt(event.target.value));

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
  const filteredDeals = currentDeals.filter(deal => deal.discount < -50);
  
  setCurrentDeals({ deals: filteredDeals, meta: currentPagination });
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

  setCurrentDeals({ deals: mostCommented, meta: currentPagination });
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

  setCurrentDeals({ deals: hotDeals, meta: currentPagination });
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

  
  setCurrentDeals({ deals: sortedDeals, meta: currentPagination });
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
  setLoadingCursor(); 
  
  let allSales = []; // Stocke toutes les ventes récupérées
  let currentPage = 1; // Commence à la première page
  const pageSize = 12; // Nombre d'éléments par page
  let hasMorePages = true; // Indique s'il reste des pages à récupérer

  try {
    while (hasMorePages) {
      // Effectue la requête pour récupérer les ventes par page
      const response = await fetch(
        `https://legoprofit.vercel.app/sales/search?legoSetId=${legoSetId}&size=${pageSize}&page=${currentPage}`
      );
      const body = await response.json();

      if (body.sales && body.sales.length > 0) {
        // Si des ventes sont trouvées, on les ajoute à la liste
        allSales = allSales.concat(body.sales);
        console.log(`Page ${currentPage} récupérée : ${body.sales.length} ventes.`);
        currentPage++; // Passer à la page suivante
      } else {
        hasMorePages = false; // Arrêter si aucune vente n'est retournée
      }
    }

    // Afficher le nombre total de ventes récupérées
    spanNbSales.innerHTML = allSales.length;

    // Calculer les jours moyens entre les ventes
    const averageDays = calculateAverageDaysBetweenSales(allSales);
    if (averageDays !== "Pas assez de données pour calculer la moyenne") {
      spanlifetimeValue.innerHTML = `${averageDays} jours`; // Afficher la moyenne des jours
    }

    console.log('Nombre total de ventes récupérées :', allSales.length);
    resetCursor();
    return allSales; // Retourner toutes les ventes récupérées
    
  } catch (error) {
    console.error('Erreur lors de la récupération des ventes :', error);
    document.getElementById('nbSales').innerText = '0'; // Si une erreur survient, afficher "0"
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
      <div class="sale" id=${sale._id}>
        <div style="display: flex; flex-direction: column; gap: 10px;">
          <!-- Start Feature 11 and 12 -->
          <a href="${sale.itemURL}" target="_blank">${sale.title}</a>
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
  const dealId = star.getAttribute('deals-id');
  event.stopPropagation();
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
  const favoriteDeals = currentDeals.filter(deal =>localStorage.getItem(`favorite-${deal.legoId}`));
  
  setCurrentDeals({ deals: favoriteDeals, meta: currentPagination });
  render(favoriteDeals, currentPagination);
}

const mustReadBtn = document.getElementById('mustReadBtn');
const developerNote = document.getElementById('developerNote');
const closeNoteBtn = document.getElementById('closeNoteBtn');

// Afficher la note lorsque le bouton Must Read est cliqué
mustReadBtn.addEventListener('click', () => {
  developerNote.style.display = 'block'; // Afficher la note
});

// Fermer la note lorsque le bouton Close est cliqué
closeNoteBtn.addEventListener('click', () => {
  developerNote.style.display = 'none'; // Cacher la note
});