let db;

const request = indexedDB.open('budget', 1);

request.onupgradeneeded = function(event) {
    //save a reference to the data base
    const db = event.target.result;
    // create an object store (table) called 'new transaction', set it to have an auto incrementing primary key of sorts
    db.createObjectStore('new_transaction', { autoIncrement: true });
}

// upon successful
request.onsuccess = function (event) {
    // when db is successfully created with its object sore (from onupgradeneeded event above) or simply established a connection, save reference to db in global variable
    db = event.target.result;

    // check if app in online, if yes run uploadTransaction() function to send all local db data to api
    if (navigator.onLine) {
        uploadTransaction();
    }
}

request.onerror = function(event) {
    console.log(event.target.errorCode);
}

function saveRecord(record) {
    // open a new transaction with the database with read and write permissions
    const transaction = db.transaction(['new_transaction'], 'readwrite');

    // access the object store for 'new_transaction'
    const tranObjectStore = transaction.objectStore('new_transaction');

    // add record to your store with add method
    tranObjectStore.add(record);
}

function uploadTransaction() {
    // open a transaction on your db
    const transaction = db.transaction(['new_transaction'], 'readwrite');

    // access your object store
    const tranObjectStore = transaction.objectStore('new_transaction');

    // get all records from store and set to variable
    const getAll = tranObjectStore.getAll();

    getAll.onsuccess = function() {
        // if there was data in indexedDb's sotre, let's send it to the api server
        if(getAll.result.length > 0) {
            fetch('/api/transaction', {
                method: 'POST',
                body: JSON.stringify(getAll.result),
                headers: {
                    Accept: 'application/json, text/plain, */*',
                    'Content-Type': 'application/json'
                }
            })
              .then(response => response.json())
              .then(serverResponse => {
                  if(serverResponse.message) {
                      throw new Error(serverResponse);
                  }
                  // open one more transaction
                  const transaction = db.transaction(['new_transaction'], 'readwrite');
                  // access the new_transaction object store
                  const tranObjectStore = transaction.objectStore('new_transaction');
                  // clear all items in your store
                  tranObjectStore.clear();

                  alert('All saved transactions have been submitted!');
              })
              .catch(err => {
                  console.log(err);
              })
        }
    }
}

window.addEventListener('online', uploadTransaction);