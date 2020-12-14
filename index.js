/** 
 ** SPAGHETTI :x
 ** REWRITE WITH OBSERVER or SUBSCRIBE / PUBLISH
 ** OO MAYBE?
 **/
(function () {
  window.addEventListener('load', documentReady, false);
  
  function documentReady(event) {
    window.removeEventListener('load', documentReady, false);
    main();
  }
  
  function setHeader(date) {
    var header = document.getElementById('header');
    var now = moment(date);
    var left = header.querySelector('.arrow--left');
    var right = header.querySelector('.arrow--right');

    left.dataset.next = now.subtract(1, 'month').format('YYYY-MM-DD');
    now.add(1, 'month');
    right.dataset.next = now.add(1, 'month').format('YYYY-MM-DD');
    now.subtract(1, 'month');

    header.querySelector('.main-date__container__day').textContent = now.date();
    header.querySelector('.main-date__container__month').textContent = now.format('MMMM');
    header.querySelector('.main-date__container__year').textContent = now.year();
  }
  
  function getTasks(date) {
    var all = JSON.parse(localStorage.getItem('tasks'));
    if (all) {
      return all[date];
    }
  }
  
  function createCalendar(date, container) {
    var date = moment(date);
    var now_date = moment();
    
    var days = date.daysInMonth();
    var firstDay = date.set('date', 1).isoWeekday();
    var skipDays = firstDay - 1;
    var calTemplate = Handlebars.compile(document.getElementById('cal').innerHTML);
    var data = { days: [] }
    
    for(i = 1; i <= days + skipDays; i++) {
      var day = {};
      if (i === 1) day.first = true;
      if (i === days) day.last = true;
      if (((i-1) % 7) === 0) {
        day.newWeek = true;
      }
      if (i - skipDays > 0) {
        day.number = i - skipDays;
        var date_string = date.format('YYYY-MM-DD');
        day.date = date_string;
        if (now_date.isSame(date, 'day')) {
          day.today = true;
        }
        var tasks = getTasks(date.format('YYYY-MM-DD'));
        if (tasks) {
          var undone = tasks.filter(function (t) { return t.done === false; });
          if (undone.length > 0) {
              day.has_tasks = true;
              day.done = false;
          } else {
            day.has_tasks = false;
            day.done = true;
          }
        } else {
          day.has_tasks = false;
          day.done = false;
        }
        date.add(1, 'day');
      }
      data.days.push(day);
    }
    container.innerHTML = calTemplate(data);
  }
  
  function createTaskContainer(date) {
    var container = document.createElement('div');
    var tasksTemplate = Handlebars.compile(document.getElementById('tasks').innerHTML);
    
    var data = { tasks: getTasks(date), date: date };
    container.innerHTML = tasksTemplate(data);
    
    return container.firstElementChild;
  }
  
  function daysGridClick(event) {
    var day = parseInt(event.target.textContent);
    var inputEventBind;
    
    if (day) {
      var date = event.target.offsetParent.dataset.date;
      var container = createTaskContainer(date);

      if (!event.target.classList.contains('day__status--taskopen')) {
        [].slice.call(document.querySelectorAll('.day__status--taskopen')).forEach(function (el) {
          el.classList.remove('day__status--taskopen');
        });
        [].slice.call(document.querySelectorAll('.daysgrid__tasks')).forEach(function (el) {
          el.parentNode.removeChild(el);
        });
        inputEventBind = bindInput(container);
        event.target.classList.add('day__status--taskopen');
        event.target.parentNode.parentNode.parentNode.insertBefore(container, event.target.parentNode.parentNode.nextSibling);
      } else {
        if (inputEventBind) inputEventBind.removeEventListener('keyup', inputKeyUp, false);
        event.target.classList.remove('day__status--taskopen')
        event.target.parentNode.parentNode.parentNode.removeChild(event.target.parentNode.parentNode.nextSibling);
      }
    } else if (event.target.classList.contains('btn')) {
      var date = event.target.parentNode.parentNode.parentNode.dataset.tasksfor;
      var id = event.target.parentNode.dataset.taskid;
      var ul = event.target.parentNode.parentNode;
      
      ul.removeChild(event.target.parentNode);

      var lis = getLiData(ul);
      updateStorage(date, lis);
      updateDay(date, lis);
    
    } else if (event.target.type === "checkbox") {
      var date = event.target.parentNode.parentNode.parentNode.dataset.tasksfor;
      var id = event.target.parentNode.dataset.taskid;
      var ul = event.target.parentNode.parentNode;

      var lis = getLiData(ul);
      updateStorage(date, lis);
      updateDay(date, lis);     
    }
  }
  
  function getLiData(ul) {
    var data = [];
    var lis = [].slice.call(ul.querySelectorAll('li'));
    
    lis.forEach(function(li) {
      var temp = {};
      if (!!li.querySelector('input').checked === true) temp.done = true;
      else temp.done = false;
      temp.id = li.querySelector('input').id;
      temp.title = li.querySelector('label').textContent;
      data.push(temp);
    });

    return data;
  }
  
  function updateStorage(date, lis) {
    var data = (JSON.parse(localStorage.getItem('tasks')) || {});
    if (lis.length === 0) delete data[date];
    else data[date] = lis;
    localStorage.setItem('tasks', JSON.stringify(data));    
  }
  
  function updateDay(date, lis) {
    var day = document.querySelector('div[data-date="' + date + '"]');
    var status = day.querySelector('.day__status');
    var undone = lis.filter(function (li) { return li.done === false; });
    
    status.classList.remove('day__status--done');
    status.classList.remove('day__status--undone');
    
    if (lis.length > 0) {
      if (undone.length > 0) {
        status.classList.remove('day__status--done');
        status.classList.add('day__status--undone');
      } else {
        status.classList.remove('day__status--undone');
        status.classList.add('day__status--done');
      }
    }
  }
  
  function loadMonth(event) {
    var newDate = this.dataset.next;
    var daysGrid = document.getElementById('daysgrid');
    setHeader(newDate);
    createCalendar(newDate, daysGrid);
  }
  
  function bindInput(taskList) {
    var input = taskList.querySelector('#task_input');
    input.addEventListener('keyup', inputKeyUp, false);
    return input;
  }
  
  function createId() {
    return Math.random().toString(36).replace(/[^a-z]+/g, '').substr(0, 8);
  }
  
  function addTask(container, title) {
    var cont = document.createElement('ul');
    var date = container.parentNode.dataset.tasksfor;
    var taskTemplate = Handlebars.compile(document.getElementById('task').innerHTML);
    var id = createId();

    cont.innerHTML = taskTemplate({id: id, title: title, done: false});
    container.appendChild(cont.firstElementChild);

    var lis = getLiData(container);
    updateStorage(date, lis)
    updateDay(date, lis);
  }
  
  function inputKeyUp(event) {
    var taskList = event.target.parentNode.querySelector('ul');
    var text;
    
    if (event.keyCode === 0x0D) {
      event.preventDefault();
      text = event.target.value;
      event.target.value = '';
      if (!!text) addTask(taskList, text);
    }
  }
  
  function createDays(container, days) {
    var daysTemplate = Handlebars.compile(document.getElementById('days_template').innerHTML);
    container.innerHTML = daysTemplate({ days: days });
  }
  
  function main() {
    var data = new Date();
    var daysGrid = document.getElementById('daysgrid');
    var prev = document.querySelector('.arrow--left');
    var next = document.querySelector('.arrow--right');
    
    moment.locale(window.navigator.language || 'en');
    var days = moment.weekdaysShort();
    var first_day = days[0];
    days = days.slice(1).concat(first_day);

    daysGrid.addEventListener('click', daysGridClick, false);
    prev.addEventListener('click', loadMonth, false);
    next.addEventListener('click', loadMonth, false);
    
    setHeader(data);
    createDays(document.getElementById('days'), days);
    createCalendar(data, daysGrid);
  };
}());



