import { readTodos, createTodo, updateTodo, deleteTodo } from './api.js';
import { dateEl } from './date.js';
import { editButton } from './edit.js';
import { deleteButton } from './delete.js';
import { loading } from './loading.js';
import { Filter } from './select.js';

let preventDoubleClick = false;
const inputEl = document.querySelector('.header__input');
const create_btnEl = document.querySelector('.header__inputBtn');
const listEl = document.querySelector('.list');
const all_del_btnEl = document.querySelector('.header__deleteBtn');
const loadingEl = document.querySelector('.loading');

// 입력시 inputText에 저장
let inputText = '';
inputEl.addEventListener('input', () => {
	inputText = inputEl.value;
});

// 입력 후 엔터시 생성
inputEl.addEventListener('keydown', (event) => {
	if (event.key === 'Enter' && !event.isComposing) {
		if (event.key === 'Enter' && !event.isComposing) {
			if (inputText.length > 20) {
				alert('20자 이내로 입력해주세요.');
			} else {
				create_btnEl.click();
				inputEl.value = '';
			}
			event.preventDefault();
		}
	}
});

// 생성 버튼 클릭시 생성
create_btnEl.addEventListener('click', async () => {
	if (preventDoubleClick) return;
	preventDoubleClick = true;

	if (inputText.length > 20) {
		alert('20자 이내로 입력해주세요.');
	} else {
		await createTodo(inputText);
		loading();
		inputEl.value = '';
	}

	preventDoubleClick = false;
});

// 전체 삭제 버튼 클릭시 삭제
all_del_btnEl.addEventListener('click', async () => {
	if (preventDoubleClick) return;
	preventDoubleClick = true;
	const todos = await readTodos();
	todos.forEach(async (todo) => {
		await deleteTodo(todo.id);
		const todoItem = JSON.parse(localStorage.getItem('todo')) || [];
		const updatedTodoItem = todoItem.filter((item) => item.id !== todo.id);
		localStorage.setItem('todo', JSON.stringify(updatedTodoItem));
	});
	loadingEl.style.display = 'block';
	setTimeout(() => {
		loadingEl.style.display = 'none';
		renderTodos(todos);
		location.reload();
	}, 4000);
	preventDoubleClick = false;
});

// 드래그 앤 드랍
Sortable.create(listEl, {
	animation: 150,
	ghostClass: 'blue-background-class',
});

(async () => {
	const todos = await readTodos();
	setTimeout(() => {
		loadingEl.style.display = 'none';
		renderTodos(todos);
	}, 1000);
})();

export async function renderTodos(todos) {
	const todoList = todos.map((todo) => {
		const listItem = document.createElement('li');
		listItem.classList.add('list__item');
		listItem.innerHTML = `<span class="todo__title">${todo.title}</span>`;

		const done_btnEl = document.createElement('div');
		done_btnEl.classList.add('done__btn');

		done_btnEl.addEventListener('click', async () => {
			await updateTodo({
				...todo,
				done: !todo.done,
			});
			loading();
		});

		if (todo.done) {
			listItem.classList.add('done');
			done_btnEl.classList.add('done__btn--checked');
		}

		const dateElement = dateEl(todo.createdAt, todo.updatedAt);
		const edit_btnEl = editButton(todo);
		const del_btnEl = deleteButton(todo.id);

		const priorityEl = document.createElement('select');
		priorityEl.classList.add('priority');
		const priorityOptions = [
			{ value: '0', textContent: '🏅' },
			{ value: '1', textContent: '🥇' },
			{ value: '2', textContent: '🥈' },
			{ value: '3', textContent: '🥉' },
		];

		priorityOptions.forEach((optionData) => {
			const option = document.createElement('option');
			option.value = optionData.value;
			option.textContent = optionData.textContent;
			priorityEl.appendChild(option);
		});

		function doneBtnColor(value) {
			done_btnEl.classList.remove('done__btn--default');
			done_btnEl.classList.remove('done__btn--red');
			done_btnEl.classList.remove('done__btn--blue');
			done_btnEl.classList.remove('done__btn--green');

			if (value === '0') {
				done_btnEl.classList.add('done__btn--default');
				priorityEl.value = '0';
			} else if (value === '1') {
				done_btnEl.classList.add('done__btn--red');
				priorityEl.value = '1';
			} else if (value === '2') {
				done_btnEl.classList.add('done__btn--blue');
				priorityEl.value = '2';
			} else if (value === '3') {
				done_btnEl.classList.add('done__btn--green');
				priorityEl.value = '3';
			}
		}

		const todoItem = JSON.parse(localStorage.getItem('todo')) || [];
		todoItem.forEach((item) => {
			if (todo.id && item.id === todo.id) {
				doneBtnColor(item.value);
			}
		});

		priorityEl.addEventListener('change', async () => {
			doneBtnColor(priorityEl.value);

			const todoData = { id: todo.id, value: priorityEl.value };
			const existingData = localStorage.getItem('todo');
			let todos = existingData ? JSON.parse(existingData) : [];
			const isDuplicateId = todos.some((item) => item.id === todo.id);
			if (!isDuplicateId) {
				todos.push(todoData);
				localStorage.setItem('todo', JSON.stringify(todos));
			}
			const updatedTodos = todos.map((item) => {
				if (item.id === todo.id) {
					return { ...item, value: priorityEl.value };
				}
				return item;
			});

			localStorage.setItem('todo', JSON.stringify(updatedTodos));
		});

		listItem.append(done_btnEl, edit_btnEl, del_btnEl, priorityEl, dateElement);
		return listItem;
	});
	listEl.innerHTML = '';
	listEl.append(...todoList);
}
Filter();
