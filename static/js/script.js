'use strict';
// Your client side JavaScript code goes here.
// This file is included in every page.


// List is the class all state management throughout the client side, with state being the global instance of List

let state;

class List {
    constructor(rows){
        this.rows = rows
        this.showForm = false
        this.listText = ""
    }

    updateRowName(id, newName){
      let r = this.rows.findIndex((row) => {return row.id == id });
      this.rows[r].name = newName
    }
    updateRows(newRow){
      let r = this.rows.findIndex((row) => {return row.id === newRow.id });
      this.rows.splice(r, 1, newRow);
    }

    addList(newRow){
      this.rows.push(newRow);
    }

    addCard(rowToAddCard, newCard){
      let r = this.rows.findIndex((row) => {return row.id == rowToAddCard });
      if(!this.rows[r].cards){
          this.rows[r].cards = []
      }
      this.rows[r].cards.push(newCard)
    }

    updateCard(rowId, card, cardIndex){
      let r = this.rows.findIndex((row) => {return row.id == rowId });
      this.rows[r].cards[cardIndex] = card
    }

    moveCard(index, rowId, upDown){
      let r = this.rows.findIndex((row) => {return row.id == rowId });
      let card = this.rows[r].cards[index]
      this.rows[r].cards.splice(index, 1)
      // place card before or after previous index
      this.rows[r].cards.splice(index + upDown, 0, card)
    }

    moveRow(index, upDown) {
      let r = this.rows[index]
      let tempPos = r.pos
      r.pos = this.rows[index + upDown].pos
      this.rows[index + upDown].pos = tempPos
      this.rows.splice(index, 1)
      // place row before or after previous index
      this.rows.splice(index + upDown, 0, r)
    }

    deleteCard(rowId, cardIndex){
      let r = this.rows.findIndex((row) => {return row.id == rowId });
      this.rows[r].cards.splice(cardIndex, 1)
    }

    deleteRow(rowId){
      let index = this.rows.findIndex((row) => {return row.id == rowId})
      this.rows.splice(index, 1)
    }
};

// Example code for getting all `list`s from server
function loadLists() {
  return $.ajax('/api/lists');
}

// Example code for displaying lists in the browser
function displayLists(lists) {
  // Lists should be ordered based on their 'pos' field
  state.rows = _.sortBy(lists.rows, 'pos');
  if (state.rows[0].pos !== 0){
    state.rows[0].pos = 0
  }
  state.rows.forEach(function(list) {
    // add each list to the DOM
    appendList(list);
  });
}

function appendList(list){
  // create list div with header and edit/delete/navigation buttons appended
  var curElem = $(`<div id=${list.id}>`).append($(`<h1 id=${list.id} class='lists-header'>${list.name}</h1>`));
    let outerButton = $(`<img onclick="showEditList()" name="edit" class="edit-list" src="./img/edit.png">
                         <img onclick="deleteList(${list.id})" class="delete-btn-list" src="./img/delete.png">
                         <img onclick="showAddCard()" class="plus-list" src="./img/plus.png">
                         <img onclick="moveRow(1)" class="right-arrow-list" src="./img/right-arrow.png">
                         <img onclick="moveRow(-1)" class="left-arrow-list" src="./img/left-arrow.png">`);
    curElem.append(outerButton);
    // if the list has cards create ul and list items to append to the div
    if (list.cards) {
      var innerUl = $(`<ul id=${list.id} class="cards" >`);
      list.cards.forEach(function(card) {
        appendCard(list, innerUl, card);
      });
      curElem.append(innerUl);
    }
    // create a new list div and append it after the final list div
      let lastPos = $('body').children('div.lists').slice(-1)[0]
      if(!lastPos){
        lastPos = $('.container')
      }
    if(! $('.lists#'+ list.pos).length){
      $(lastPos).after($(`<div class="lists" id=${list.pos}></div>`))
    }
    let prev = $('#'+ list.pos + ".lists" )
    prev.append(curElem);
}

function appendCard(list, innerUl, card){
    let index = list.cards.findIndex((c) => {return c === card});
    let p = $('<p onclick="showEditCard()" class="card">' + card + '</p>')[0]
    let li = $('<li class="card" id='+ index+ '>').append(p)
    // if list does not have any cards, create a UL for them
    if(!innerUl){
      if(event.key === "Enter"){
        event.target.parentElement.parentElement.append($(`<ul id=${list.id} class="cards"></ul>`)[0])
        innerUl = $(event.target.parentElement).siblings('ul')[0]
      } else {
        event.target.parentElement.append($(`<ul id=${list.id} class="cards"></ul>`)[0])
        innerUl = $(event.target).siblings('ul')[0]
      }
    }
    // add cards to UL
    innerUl.append(li[0]);
    let innerButton = $(`<img onclick="moveCard(${list.id}, -1)" class="up-arrow" src="./img/up-arrow.png">
                         <img onclick="moveCard(${list.id}, 1)" class="down-arrow" src="./img/down-arrow.png">
                         <img onclick="deleteCard()" class="delete-btn" src="./img/delete.png">`
                         );
    // add buttons to each card
    li.append(innerButton);
}

// adding lists to the browser and database

function addList(name, pos, cards) {
  return $.ajax({
    url: '/api/lists',
    type: 'POST',
    data: {name: name, pos: pos, cards: cards}
  }).done((response)=>{
    // if response is not autogenerated from initial running of the program (i.e. the database isn't empty), state was already be an instance of List
    if(state){
      state.addList(response)
      appendList(response);
    }
    // return response for callback chain in onload function
    return response
  })
}

function showEditList(){
  if(!state.showForm){
    // disallow user for showing another form while current one has not been submitted or dismissed
    state.showForm = true
    // store user input on state object to allow for easier access and extendability
    state.listText = event.currentTarget.previousElementSibling.innerText
    let parent = event.currentTarget.parentElement
    let id = event.currentTarget.parentElement.id
    let form = $(`
                  <form onsubmit="editList(${id})">
                    <textarea class="textarea-list" type="text" name="text" >${state.listText}</textarea>
                    <input class="textarea-card-btn" type="image" src="./img/checkmark.png" alt="submit" />
                    <img onclick="removeEditList()" class="delete-edit-list-btn" src="./img/delete-x.png">
                  </form>
                  `)[0]
    $(form.firstElementChild).on('keydown', function(event) {
        if (event.keyCode == 13) {
            $(this).submit()
         }
      })
    // replace h1 with form
    let header = $('#'+id+'.lists-header')
    header[0].innerText = ""
    header.append(form)
    $(form.firstElementChild)[0].focus()
  }
}

  function removeEditList(){
    event.target.parentElement.remove()
    // prevent triggering click event on p element when user clicks to remove edit list form
    setTimeout(()=>{state.showForm = false;}, 500)
  }

  function showEditCard(){
    if(!state.showForm ){
      // disallow user for showing another form while current one has not been submitted or dismissed
      state.showForm = true
      state.listText = event.currentTarget.innerText
      event.currentTarget.innerText = ""
      let rowId = event.target.parentElement.parentElement.parentElement.id
      let cardIndex = event.currentTarget.parentElement.id
      let form = $(`<form onsubmit="editCard(${rowId}, ${cardIndex})">
                      <textarea class="textarea-card" type="text" name="text">${state.listText}</textarea>
                      <input class="textarea-card-btn" type="image" src="./img/checkmark.png" alt="submit" />
                      <img onclick="removeEditCard()" class="delete-edit-card-btn" src="./img/delete-x.png">
                    </form>
                  `)[0]
      event.currentTarget.append(form)
      $(form.firstElementChild).focus();
    }
  }

  function editCard(rowId, cardIndex){
    let text = event.currentTarget.text.value
    state.updateCard(rowId, text, cardIndex);
    updateList(rowId);
    // update DOM text and allow users to show another form
    $(event.target.parentElement).text(text)
    state.showForm = false
    event.target.remove()
  }

  function moveCard(rowId, upDown){
    let index = parseInt(event.target.parentElement.id)
    let r = state.rows.find((row) => {return row.id == rowId });
    let ul = $('#'+ r.id +".cards" );
    let li = ul.find('li.card');
    // account for (literal) edge cases of click up or down when element is at the top or bottom of the UL
    if((index > 0 && upDown === -1)||(index < li.length -1 && upDown === 1)){
      state.moveCard(index, rowId, upDown);
      updateList(rowId);
      // reassign ids to coalign with index in state.rows[i].cards
      li[index].id = index + upDown;
      li[index + upDown].id = index;
      li.detach();
      let sortedLi = _.sortBy(li, (a)=> { return parseInt(a.id) });
      ul.append(sortedLi);
    }
  }

  function moveRow(upDown){
    let listPos = parseInt(event.target.parentElement.parentElement.id)
    // row pos and row index may differ if previous row has been deleted
    let listIndex = state.rows.findIndex((row)=>{return row.pos == listPos})
    let r = state.rows[listIndex]
    let switchedRow = state.rows[listIndex + upDown];
    // get an array-like objext of all the list divs to modify their ids
    let lists = $('body').find('div.lists');
    if((listIndex > 0 && upDown === -1)||(listIndex < lists.length -1 && upDown === 1)){
      state.moveRow(listIndex, upDown);
      // to use enumerable methods, lists must be transformed into an array, and the two rows that are switching positions in the DOM also switch their ids
      lists.toArray()[listIndex].id = r.pos
      lists.toArray()[listIndex + upDown].id = switchedRow.pos
      updateList(r.id);
      updateList(switchedRow.id);
      lists.detach();
      // re-sort and reattach lists by id
      let sortedLists = _.sortBy(lists, (a)=> { return parseInt(a.id) })
      $('.container').after(sortedLists);
    }
  }

  function editList(rowId) {
    event.preventDefault();
    let newName;
    // user can submit with enter or button
    if(event.key === "Enter"){
      newName = event.target.parentElement.firstElementChild.value;
      // add newName to H1
      $(event.target.parentElement.parentElement)[0].innerText = newName
    } else{
      newName = event.target.firstElementChild.value;
      $(event.target.parentElement)[0].innerText = newName;
    }
    state.updateRowName(rowId, newName);
    updateList(rowId);
    // allow user to show new form
    state.showForm = false
    if(event.key === "Enter"){
      event.target.parentElement.remove()
    } else{
      event.target.remove()
    }
  }


  function updateList(id){
    event.preventDefault();
    // get row id from li, then find row by id in state variable
    let row = _.find(state.rows, function(row){ return row.id == id; });
    $.ajax({
      url: '/api/lists/:' + id,
      type: 'POST',
      data: {name: row.name, pos: row.pos, cards: row.cards, id: row.id}
    }).done((response) => {
      return response;
    });
  }

  function deleteList(listId){
    let r = state.rows.find((row) => {return row.id === listId})
    // grab DOM element and remove it, as well as delete from storage
    let list = $('body').find($('#' + r.pos +'.lists'))
    list.remove();
    state.deleteRow(listId)
    $.ajax({
      url: '/api/lists/:' + listId,
      type: 'DELETE'
    }).done((response)=>{
      console.log(response);
    });
  }

  function deleteCard(){
    let rowId = event.target.parentElement.parentElement.parentElement.id
    let cardIndex = event.target.parentElement.id
    state.deleteCard(rowId, cardIndex);
    event.target.parentElement.remove()
    //update id on li to reflex new indexing
    let r = state.rows.find((row)=> {return row.id == rowId})
    let ul = $('#'+ r.id +".cards" );
    let li = ul.find('li.card');
    li.toArray().forEach((cardLi, i) =>{
        cardLi.id = i
    });
    updateList(rowId);
  }

  function removeEditCard(){
    $(event.target.parentElement.parentElement).text(state.listText)
    // keep from triggering click event on showAddCard when user triggers removeEditCard
    setTimeout(()=>{state.showForm = false;}, 500)
  }

  function showAddCard() {
    // if another form isn't already being shown
    if(!state.showForm){
      state.showForm = true
      let parent = event.currentTarget.parentElement
      let form = $(`
                  <form onsubmit="addCard()">
                    <textarea class="textarea-card" type="text" name="text" placeholder="add card..."></textarea>
                    <input class="textarea-card-btn" type="image" src="./img/checkmark.png" alt="submit" />
                    <img onclick="removeEditList()" class="delete-edit-card-btn" src="./img/delete-x.png">
                  </form>
                  `)[0]
      $(form.firstElementChild).on('keydown', function(event) {
        if (event.keyCode == 13) {
            $(this).submit()
         }
      })
      parent.append(form)
      $(form.firstElementChild)[0].focus()
    }
  }

function addCard(){
  event.preventDefault();
  let card, rowId, ul;
  // if user presses enter to submit
  if(event.key === "Enter"){
    card = event.target.value
    rowId = event.target.parentElement.parentElement.id
    ul = $(event.target.parentElement).siblings('ul')[0]
    event.target.value = ""
  } else {
    rowId = event.target.parentElement.id;
    card = event.target.text.value;
    ul = $(event.target).siblings('ul')[0]
    event.target.text.value = "";
  }
  state.addCard(rowId, card);
  updateList(rowId);
  let list = state.rows.find((row) => {return row.id == rowId });
  appendCard(list, ul , card);
  // allow user to show another form somewhere else
  state.showForm = false
  if(event.key === "Enter"){
    event.target.parentElement.remove()
  } else {
    event.target.remove();
  }
}


// create new list
$('#add-list').on('submit', function(e) {
  e.preventDefault();
  let formData = $('[name=name]').val();
  // add pos that exceeds that final list by one
  let pos = _.max(state.rows, function(row){ return row.pos; }).pos + 1;
  addList(formData, pos);
  $('[name=name]')[0].value = "";
});

loadLists()
.then(function(data) {
  console.log('Lists', data.rows);
  if (data.rows.length) {
    state = new List(data.rows)
    // If some lists are found display them
    displayLists(data);
  } else {
    // If no lists are found, create sample list
    // and re-display.
    console.log('No lists found, creating one.');
    addList('Hello', 0, ['Card 1', 'Card 2'])
      .then(function(list) {
        console.log('Created list', list);
        return loadLists();
      })
      .then(function(lists) {
        state = new List(lists.rows)
        displayLists(lists);
      })
  }

});