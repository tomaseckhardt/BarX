// Skript pro rozbalení dalších drinků

document.addEventListener('DOMContentLoaded', function () {
  const showMoreBtn = document.getElementById('showMoreDrinks');
  const menuGrid = document.getElementById('menuGrid');

  // Vytvořte HTML pro dalších 9 drinků (ukázka, uprav dle potřeby)
  const moreDrinksHTML = `
    <div class="drink-card theme-gold animated-drink" data-category="signature">
      <span class="drink-badge">Signature</span>
      <div class="drink-name">Aurora Bliss</div>
      <div class="drink-sub">Gin · Yuzu · Levandule</div>
      <p class="drink-desc">Jemný gin s exotickým yuzu a květy levandule. Svěží, květinový zážitek.</p>
      <div class="drink-footer"><span class="drink-price">159 Kč</span><div class="drink-abv"><div class="abv-dots"><div class="abv-dot filled"></div><div class="abv-dot filled"></div><div class="abv-dot filled"></div><div class="abv-dot"></div><div class="abv-dot"></div></div>Síla</div></div>
    </div>
    <div class="drink-card theme-purple animated-drink" data-category="long">
      <span class="drink-badge">Long Drink</span>
      <div class="drink-name">Berry Fizz</div>
      <div class="drink-sub">Vodka · Lesní ovoce · Soda</div>
      <p class="drink-desc">Ovocný long drink s jemnou perlivostí a svěží chutí lesního ovoce.</p>
      <div class="drink-footer"><span class="drink-price">135 Kč</span><div class="drink-abv"><div class="abv-dots"><div class="abv-dot filled"></div><div class="abv-dot filled"></div><div class="abv-dot"></div><div class="abv-dot"></div><div class="abv-dot"></div></div>Síla</div></div>
    </div>
    <div class="drink-card theme-red animated-drink" data-category="shot">
      <span class="drink-badge">Shot</span>
      <div class="drink-name">Firestarter</div>
      <div class="drink-sub">Tequila · Chilli · Limetka</div>
      <p class="drink-desc">Pikantní shot s tequilou, chilli a limetkou. Pro odvážné!</p>
      <div class="drink-footer"><span class="drink-price">75 Kč</span><div class="drink-abv"><div class="abv-dots"><div class="abv-dot filled"></div><div class="abv-dot filled"></div><div class="abv-dot filled"></div><div class="abv-dot"></div><div class="abv-dot"></div></div>Síla</div></div>
    </div>
    <div class="drink-card theme-pink animated-drink" data-category="bezalkohol">
      <span class="drink-badge">Bez alkoholu</span>
      <div class="drink-name">Pink Dream</div>
      <div class="drink-sub">Jahoda · Vanilka · Soda</div>
      <p class="drink-desc">Sladký a osvěžující nealko drink s jahodou a vanilkou.</p>
      <div class="drink-footer"><span class="drink-price">89 Kč</span><div class="drink-abv"><div class="abv-dots"><div class="abv-dot"></div><div class="abv-dot"></div><div class="abv-dot"></div><div class="abv-dot"></div><div class="abv-dot"></div></div>0% ABV</div></div>
    </div>
    <div class="drink-card theme-gold animated-drink" data-category="signature">
      <span class="drink-badge">Signature</span>
      <div class="drink-name">Golden Hour</div>
      <div class="drink-sub">Rum · Mango · Limetka</div>
      <p class="drink-desc">Exotický rumový koktejl s mangem a limetkou. Slunce ve sklenici.</p>
      <div class="drink-footer"><span class="drink-price">149 Kč</span><div class="drink-abv"><div class="abv-dots"><div class="abv-dot filled"></div><div class="abv-dot filled"></div><div class="abv-dot filled"></div><div class="abv-dot"></div><div class="abv-dot"></div></div>Síla</div></div>
    </div>
    <div class="drink-card theme-teal animated-drink" data-category="long">
      <span class="drink-badge">Long Drink</span>
      <div class="drink-name">Minty Lake</div>
      <div class="drink-sub">Gin · Máta · Okurka</div>
      <p class="drink-desc">Lehký a osvěžující drink s mátou a okurkou. Ideální na léto.</p>
      <div class="drink-footer"><span class="drink-price">139 Kč</span><div class="drink-abv"><div class="abv-dots"><div class="abv-dot filled"></div><div class="abv-dot filled"></div><div class="abv-dot"></div><div class="abv-dot"></div><div class="abv-dot"></div></div>Síla</div></div>
    </div>
    <div class="drink-card theme-red animated-drink" data-category="shot">
      <span class="drink-badge">Shot</span>
      <div class="drink-name">Red Rocket</div>
      <div class="drink-sub">Vodka · Brusinka · Limetka</div>
      <p class="drink-desc">Ostrý shot s vodkou, brusinkou a limetkou. Rychlý start večera!</p>
      <div class="drink-footer"><span class="drink-price">79 Kč</span><div class="drink-abv"><div class="abv-dots"><div class="abv-dot filled"></div><div class="abv-dot filled"></div><div class="abv-dot"></div><div class="abv-dot"></div><div class="abv-dot"></div></div>Síla</div></div>
    </div>
    <div class="drink-card theme-pink animated-drink" data-category="bezalkohol">
      <span class="drink-badge">Bez alkoholu</span>
      <div class="drink-name">Coco Kiss</div>
      <div class="drink-sub">Kokos · Ananas · Soda</div>
      <p class="drink-desc">Tropický nealko drink s kokosem a ananasem. Sladký a jemný.</p>
      <div class="drink-footer"><span class="drink-price">85 Kč</span><div class="drink-abv"><div class="abv-dots"><div class="abv-dot"></div><div class="abv-dot"></div><div class="abv-dot"></div><div class="abv-dot"></div><div class="abv-dot"></div></div>0% ABV</div></div>
    </div>
    <div class="drink-card theme-gold animated-drink" data-category="signature">
      <span class="drink-badge">Signature</span>
      <div class="drink-name">Sunset Boulevard</div>
      <div class="drink-sub">Whiskey · Pomeranč · Med</div>
      <p class="drink-desc">Hřejivý whiskey koktejl s pomerančem a medem. Západ slunce v baru.</p>
      <div class="drink-footer"><span class="drink-price">159 Kč</span><div class="drink-abv"><div class="abv-dots"><div class="abv-dot filled"></div><div class="abv-dot filled"></div><div class="abv-dot filled"></div><div class="abv-dot"></div><div class="abv-dot"></div></div>Síla</div></div>
    </div>
  `;

  let shown = false;
  let collapseBtn = null;

  showMoreBtn.addEventListener('click', function () {
    if (!shown) {
      menuGrid.insertAdjacentHTML('beforeend', moreDrinksHTML);
      // Animace: postupné zobrazení
      const newDrinks = menuGrid.querySelectorAll('.animated-drink');
      newDrinks.forEach((el, i) => {
        setTimeout(() => {
          el.style.opacity = '';
          el.style.transform = '';
          el.classList.add('start-anim');
        }, i * 90);
      });
      // Přidání tlačítka Zabalit
      collapseBtn = document.createElement('button');
      collapseBtn.textContent = 'Zabalit';
      collapseBtn.className = 'btn btn-secondary';
      collapseBtn.style.margin = '2.2rem auto 0 auto';
      collapseBtn.style.display = 'block';
      collapseBtn.style.maxWidth = '320px';
      collapseBtn.onclick = function () {
        // Odebrat nové drinky
        newDrinks.forEach(drink => drink.remove());
        collapseBtn.remove();
        showMoreBtn.style.display = '';
        shown = false;
      };
      menuGrid.parentNode.appendChild(collapseBtn);
      showMoreBtn.style.display = 'none';
      shown = true;
    }
  });
});
