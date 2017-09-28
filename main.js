// Set provides O(1) insertion/retrieval and O(n) difference/intersection
class BookSet {
    constructor() {
        this.set = new Set();
        this.elements = {};
    }

    getElement(book) {
        return this.elements[book.id];
    }

    addElement(book, element) {
        this.elements[book.id] = element;
    }

    add(book) {
        this.set.add(book.id);
    }

    difference(books) {
        return books.filter(book => !this.set.has(book.id));
    }

    intersection(books) {
        return books.filter(book => this.set.has(book.id));
    }
}

const endpoint  = 'https://www.googleapis.com/books/v1/volumes';
const apiKey    = 'AIzaSyD1WFY4lfEOiRx4AHYpYHj9xFgGKJHU4sM';
const searchBtn = document.getElementById('search-btn');
const searchBar = document.getElementById('search-bar');
const results   = document.getElementById('results');
const error     = document.getElementById('error');
const loading   = document.getElementById('loading');
const bookSet   = new BookSet();

searchBtn.addEventListener('click', _ => searchForBooks(searchBar.value));
searchBar.addEventListener('keyup', e => {
    e.preventDefault();
    if (e.keyCode == 13) searchBtn.click();
});

// Renders an error message
function showError(msg, exception) {
    error.innerHTML = msg;
    error.style.display = 'block';
    exception && console.log(exception);
}

// Searches for books and returns a promise that resolves a JSON list
function searchForBooks(query) {
    let origQuery = query;

    searchBar.value = null;
    // Clean up input
    query = `${encodeURIComponent(query.replace(/\s+/g, ' '))
        .replace(/%20/g, '+').replace(/\+$|^\+/, '')}`;
    if (!query || query == '') return showError('Please enter a search term.');

    // Hide last error if there was any
    error.style.display = 'none';

    // Display loading text and make sure to hide it when async calls finish
    loading.style.display = 'block';

    fetch(`${endpoint}?q=${query}&key=${apiKey}`)
        .then(response => response.json())
        .then(json => {
            if (json.totalItems > 0) {
                render(bookSet.difference(json.items), bookSet.intersection(json.items));
                json.items.map(bookSet.add, bookSet);
                loading.style.display = 'none';
            } else {
                loading.style.display = 'none';
                showError(`No matches found for query '${origQuery}'.`);
            }
        })
        .catch(exception => {
            loading.style.display = 'none';
            showError('An error occurred.', exception);
        });
}

// Generate HTML and sets #results's contents to it
function render(newBooks, oldBooks) {
    for (var bk in oldBooks) {
        // Move books already in DOM but returned by current query
        // to end of newest query results
        // TODO: Interleave intersection into difference in correct order
        let book = oldBooks[bk];

        let oldBookElement = bookSet.getElement(book);
        results.insertBefore(oldBookElement, results.firstChild);
    }

    for (var bk in newBooks) {
        // Append new books to results container
        let book = newBooks[bk];

        // Create outer result element and add it to the book set
        let newBookResult = document.createElement('div');
        newBookResult.className = 'result';
        bookSet.addElement(book, newBookResult);

        // Create image div and add image link child
        let resultImageContainer = document.createElement('div');
        resultImageContainer.className = 'result-image-container';

        let coverImage = document.createElement('img');
        coverImage.className = 'cover-img';
        if (book.volumeInfo.imageLinks) {
            if (book.volumeInfo.imageLinks.thumbnail) {
                coverImage.src = book.volumeInfo.imageLinks.thumbnail;
            }
        }
        coverImage.alt = 'No cover available';
        // Wrap the cover image in a link to the book preview
        let imageLink = document.createElement('a');
        imageLink.href = `${book.volumeInfo.previewLink}`;
        imageLink.target = '_blank';
        imageLink.appendChild(coverImage);
        resultImageContainer.appendChild(imageLink);
        newBookResult.appendChild(resultImageContainer);

        // Create title div and add title link child
        let titleContainer = document.createElement('div');
        titleContainer.className = 'result-title-container';

        let title = document.createElement('a');
        title.className = 'title';
        title.href = `${book.volumeInfo.previewLink}`;
        title.target = '_blank';
        title.innerHTML = book.volumeInfo.title;
        titleContainer.appendChild(title);
        newBookResult.appendChild(titleContainer);

        // If subtitle exists, create subtitle div and add subtitle text child
        if (book.volumeInfo.subtitle) {
            let subtitleContainer = document.createElement('div');
            subtitleContainer.className = 'result-subtitle-container';

            let subtitle = document.createElement('p');
            subtitle.className = 'subtitle';
            subtitle.innerHTML = book.volumeInfo.subtitle;
            subtitleContainer.appendChild(subtitle);
            newBookResult.appendChild(subtitleContainer);
        }

        // If author(s) exists, create authors div and add authors text child
        if (book.volumeInfo.authors) {
            let authorsContainer = document.createElement('div');
            authorsContainer.className = 'result-authors-container';

            let authors = document.createElement('p');
            authors.className = 'authors';
            authors.innerHTML = 'By ';
            let count = book.volumeInfo.authors.length;
            for (var i = 0; i < count; i++) {
                let pos = i + 1;
                if (count > 1 && pos == count) authors.innerHTML += ' and ';
                if (pos > 1 && pos < count) authors.innerHTML += ', ';
                authors.innerHTML += book.volumeInfo.authors[i];
            }
            authorsContainer.appendChild(authors);
            newBookResult.appendChild(authorsContainer);
        }
        results.insertBefore(newBookResult, results.firstChild);
    }
}
