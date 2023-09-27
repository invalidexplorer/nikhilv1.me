/*!
* Start Bootstrap - Resume v7.0.6 (https://startbootstrap.com/theme/resume)
* Copyright 2013-2023 Start Bootstrap
* Licensed under MIT (https://github.com/StartBootstrap/startbootstrap-resume/blob/master/LICENSE)
*/
//
// Scripts
// 

(function() {
    "use strict";

    const select = (el, all = false) => {
        el = el.trim()
        if (all) {
          return [...document.querySelectorAll(el)]
        } else {
          return document.querySelector(el)
        }
      }    

    const typed = select('.typed')
    if (typed) {
    let typed_strings = typed.getAttribute('data-typed-items')
    typed_strings = typed_strings.split(',')
    new Typed('.typed', {
        strings: typed_strings,
        loop: true,
        typeSpeed: 150,
        backSpeed: 40,
        backDelay: 1500
    });
    }

})()

window.addEventListener('DOMContentLoaded', event => {

    // Activate Bootstrap scrollspy on the main nav element
    const sideNav = document.body.querySelector('#sideNav');
    if (sideNav) {
        new bootstrap.ScrollSpy(document.body, {
            target: '#sideNav',
            rootMargin: '0px 0px -40%',
        });
    };

    // Collapse responsive navbar when toggler is visible
    const navbarToggler = document.body.querySelector('.navbar-toggler');
    const responsiveNavItems = [].slice.call(
        document.querySelectorAll('#navbarResponsive .nav-link')
    );
    responsiveNavItems.map(function (responsiveNavItem) {
        responsiveNavItem.addEventListener('click', () => {
            if (window.getComputedStyle(navbarToggler).display !== 'none') {
                navbarToggler.click();
            }
        });
    });

});

if (window.location.href.endsWith("/git")) {
    // Redirect to the desired link
    window.location.href = "https://github.com/yashmittal-git/";
}

function populateListFromJson(jsonFile, listId) {
    fetch(jsonFile)
      .then(response => response.json())
      .then(data => {
        const list = document.getElementById(listId);
        data.forEach(item => {
          const listItem = createListItem(item);
          list.appendChild(listItem);
        });
      })
      .catch(error => {
        console.error('Error fetching JSON:', error);
      });
  }

  function createListItem(item) {
    const listItem = document.createElement('li');
    listItem.innerHTML = `
      <span class="fa-li"><i class="fas fa-chevron-right"></i></span>
      ${item.text}
    `;

    if (item.children) {
      const nestedList = document.createElement('ul');
      nestedList.classList.add('fa-ul', 'mb-0');
      item.children.forEach(child => {
        const nestedListItem = createListItem(child);
        nestedList.appendChild(nestedListItem);
      });
      listItem.appendChild(nestedList);
    }

    return listItem;
  }

  populateListFromJson('assets/data/amadeus-sde-1.json', 'amadeus-sde-1-experience');
  populateListFromJson('assets/data/amadeus-sde-intern.json', 'amadeus-sde-intern-experience');
  populateListFromJson('assets/data/summer-intern-eced.json', 'summer-intern-eced-experience');
  populateListFromJson('assets/data/portfolio-website.json', 'portfolio-website-project');
  populateListFromJson('assets/data/finance-tracker.json', 'finance-tracker-project');
