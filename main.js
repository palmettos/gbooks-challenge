class BookSet {

    constructor() {
        this.set = new Set();
    }

    difference(books) {
        let ret = books.filter(book => !this.set.has(book.id));
        for (var bk in books) this.set.add(books[bk].id);
        return ret;
    }
}

const endpoint  = 'https://www.googleapis.com/books/v1/volumes';
const apiKey    = 'AIzaSyD1WFY4lfEOiRx4AHYpYHj9xFgGKJHU4sM';
const searchBtn = document.getElementById('search-btn');
const searchBar = document.getElementById('search-bar');
const results   = document.getElementById('results');
const errorDiv  = document.getElementById('error');
const bookSet   = new BookSet();

searchBtn.addEventListener('click', _ => searchForBooks(searchBar.value));

searchBar.addEventListener('keyup', e => {
    e.preventDefault();
    if (e.keyCode == 13) searchBtn.click();
});

// Renders an error message
function showError(msg, error) {
    errorDiv.innerHTML = msg;
    errorDiv.style.visibility = 'visible';
    error && console.log(error);
}

// Searches for books and returns a promise that resolves a JSON list
function searchForBooks(query) {
    origQuery = query;

    searchBar.value = null;
    query = `${encodeURIComponent(query.replace(/\s+/g, ' '))
        .replace(/%20/g, '+').replace(/\+$|^\+/, '')}`;
    if (!query || query == '') return showError('Please enter a search term.');

    errorDiv.style.visibility = 'hidden';
    let queryDiv = document.createElement('div');
    queryDiv.className = 'query-string';
    queryDiv.innerHTML = `&darr;${origQuery}&darr;`;

    let queryHeader = document.createElement('li');
    queryHeader.className = 'query';
    queryHeader.appendChild(queryDiv);
    results.insertBefore(queryHeader, results.firstChild);

    fetch(`${endpoint}?q=${query}&key=${apiKey}`)
        .then(response => response.json())
        .then(json => {
            if (json.totalItems > 0) {
                render(bookSet.difference(json.items), origQuery, queryHeader);
            } else {
                showError('No matches found.');
            }
        })
        .catch(error => showError('An error occurred.', error));
}

// Generate HTML and sets #results's contents to it
function render(newBooks, query, anchor) {
    for (var bk in newBooks) {
        let coverImage = document.createElement('img');
        coverImage.className = 'cover-img';
        if (newBooks[bk].volumeInfo.imageLinks) {
            if (newBooks[bk].volumeInfo.imageLinks.thumbnail) {
                coverImage.src = newBooks[bk].volumeInfo.imageLinks.thumbnail;
            }
        }
        coverImage.alt = 'No cover available.';

        let title = document.createElement('p');
        title.className = 'title';
        title.innerHTML = newBooks[bk].volumeInfo.title;

        let subtitle = null;
        if (newBooks[bk].volumeInfo.subtitle) {
            subtitle = document.createElement('p');
            subtitle.className = 'subtitle';
            subtitle.innerHTML = newBooks[bk].volumeInfo.subtitle;
        }

        let authors = null;
        if (newBooks[bk].volumeInfo.authors) {
            authors = document.createElement('p');
            authors.className = 'authors';
            authors.innerHTML = 'By ';
            let authorCount = newBooks[bk].volumeInfo.authors.length;
            for (var i = 0; i < authorCount; i++) {
                let pos = i + 1;
                if (authorCount > 1 && pos == authorCount) authors.innerHTML += ' and ';
                if (pos > 1 && pos < authorCount) authors.innerHTML += ', ';
                authors.innerHTML += newBooks[bk].volumeInfo.authors[i];
            }
        }

        let viewBtn = document.createElement('input');
        viewBtn.setAttribute('type', 'button');
        let action = `window.open('${newBooks[bk].accessInfo.webReaderLink}')`;
        viewBtn.setAttribute('onclick', action);
        viewBtn.value = 'View';
        viewBtn.class = 'view-btn';

        let resultContents = document.createElement('div');
        resultContents.className = 'result-contents';
        coverImage && resultContents.appendChild(coverImage);
        resultContents.appendChild(title);
        subtitle && resultContents.appendChild(subtitle);
        authors && resultContents.appendChild(authors);
        resultContents.appendChild(viewBtn);

        let result = document.createElement('li');
        result.className = 'result';
        result.appendChild(resultContents);
        results.insertBefore(result, anchor.nextSibling);
    }
}