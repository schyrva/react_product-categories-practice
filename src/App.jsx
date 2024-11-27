import React, { useState } from 'react';
import cn from 'classnames';
import './App.scss';

import usersFromServer from './api/users';
import categoriesFromServer from './api/categories';
import productsFromServer from './api/products';

const SORTABLE_COLUMNS = {
  ID: 'id',
  NAME: 'name',
  CATEGORY: 'category',
  USER: 'user',
};

const prepareProducts = (products, categories, users) =>
  products.map(product => {
    const category = categories.find(cat => cat.id === product.categoryId);
    const owner = users.find(user => user.id === category.ownerId);

    return {
      ...product,
      category,
      owner,
    };
  });

const allProducts = prepareProducts(
  productsFromServer,
  categoriesFromServer,
  usersFromServer,
);

export const App = () => {
  const [search, setSearch] = useState('');
  const [selectedUserId, setSelectedUserId] = useState(null);
  const [selectedCategoryIds, setSelectedCategoryIds] = useState([]);
  const [sortConfig, setSortConfig] = useState({ column: null, order: null });
  const [filteredProducts, setFilteredProducts] = useState(allProducts);

  const applyFilters = (searchValue, userId, categoryIds, sort) => {
    let updatedProducts = allProducts.filter(product => {
      const matchesSearch = product.name
        .toLowerCase()
        .includes(searchValue.toLowerCase());
      const matchesUser = !userId || product.owner.id === userId;
      const matchesCategory =
        categoryIds.length === 0 || categoryIds.includes(product.category.id);

      return matchesSearch && matchesUser && matchesCategory;
    });

    if (sort.column) {
      const getValue = (product, column) => {
        if (column === SORTABLE_COLUMNS.CATEGORY) return product.category.title;
        if (column === SORTABLE_COLUMNS.USER) return product.owner.name;

        return product[column];
      };

      updatedProducts = updatedProducts.sort((a, b) => {
        const aValue = getValue(a, sort.column);
        const bValue = getValue(b, sort.column);

        if (aValue < bValue) return sort.order === 'asc' ? -1 : 1;
        if (aValue > bValue) return sort.order === 'asc' ? 1 : -1;

        return 0;
      });
    }

    setFilteredProducts(updatedProducts);
  };

  const handleSearchChange = event => {
    const { value } = event.target;

    setSearch(value);
    applyFilters(value, selectedUserId, selectedCategoryIds, sortConfig);
  };

  const handleUserSelect = userId => {
    setSelectedUserId(userId);
    applyFilters(search, userId, selectedCategoryIds, sortConfig);
  };

  const toggleCategorySelection = categoryId => {
    const updatedCategoryIds = selectedCategoryIds.includes(categoryId)
      ? selectedCategoryIds.filter(id => id !== categoryId)
      : [...selectedCategoryIds, categoryId];

    setSelectedCategoryIds(updatedCategoryIds);
    applyFilters(search, selectedUserId, updatedCategoryIds, sortConfig);
  };

  const resetFilters = () => {
    setSearch('');
    setSelectedUserId(null);
    setSelectedCategoryIds([]);
    setSortConfig({ column: null, order: null });
    setFilteredProducts(allProducts);
  };

  const handleSort = column => {
    let newOrder = 'asc';
    let newColumn = column;

    if (sortConfig.column === column && sortConfig.order === 'asc') {
      newOrder = 'desc';
    } else if (sortConfig.column === column && sortConfig.order === 'desc') {
      newColumn = null;
      newOrder = null;
    }

    const newSortConfig = { column: newColumn, order: newOrder };

    setSortConfig(newSortConfig);
    applyFilters(search, selectedUserId, selectedCategoryIds, newSortConfig);
  };

  return (
    <div className="section">
      <div className="container">
        <h1 className="title">Product Categories</h1>
        <div className="block">
          <nav className="panel">
            <p className="panel-heading">Filters</p>
            <p className="panel-tabs has-text-weight-bold">
              <a
                href="#/"
                data-cy="FilterAllUsers"
                className={cn({ 'is-active': !selectedUserId })}
                onClick={() => handleUserSelect(null)}
              >
                All
              </a>
              {usersFromServer.map(user => (
                <a
                  key={user.id}
                  href="#/"
                  data-cy="FilterUser"
                  className={cn({ 'is-active': selectedUserId === user.id })}
                  onClick={() => handleUserSelect(user.id)}
                >
                  {user.name}
                </a>
              ))}
            </p>
            <div className="panel-block">
              <p className="control has-icons-left has-icons-right">
                <input
                  type="text"
                  className="input"
                  placeholder="Search"
                  value={search}
                  onChange={handleSearchChange}
                  data-cy="SearchField"
                />
                {search && (
                  <button
                    type="button"
                    className="delete"
                    onClick={resetFilters}
                    data-cy="ClearButton"
                  />
                )}
              </p>
            </div>
            <div className="panel-block is-flex-wrap-wrap">
              <a
                href="#/"
                data-cy="AllCategories"
                className={cn('button mr-6', {
                  'is-success': selectedCategoryIds.length === 0,
                  'is-outlined': selectedCategoryIds.length > 0,
                })}
                onClick={() => {
                  setSelectedCategoryIds([]);
                  applyFilters(search, selectedUserId, [], sortConfig);
                }}
              >
                All
              </a>
              {categoriesFromServer.map(category => (
                <a
                  key={category.id}
                  href="#/"
                  data-cy="Category"
                  className={cn('button mr-2 my-1', {
                    'is-info': selectedCategoryIds.includes(category.id),
                  })}
                  onClick={() => toggleCategorySelection(category.id)}
                >
                  {category.title}
                </a>
              ))}
            </div>
            <div className="panel-block">
              <button
                type="button"
                className="button is-link is-outlined is-fullwidth"
                onClick={resetFilters}
                data-cy="ResetAllButton"
              >
                Reset All Filters
              </button>
            </div>
          </nav>
        </div>
        <div className="box table-container">
          {filteredProducts.length === 0 ? (
            <p data-cy="NoMatchingMessage">
              No products matching selected criteria
            </p>
          ) : (
            <table
              className="table is-striped is-narrow is-fullwidth"
              data-cy="ProductTable"
            >
              <thead>
                <tr>
                  {Object.values(SORTABLE_COLUMNS).map(column => (
                    <th key={column}>
                      <button
                        type="button"
                        onClick={() => handleSort(column)}
                        className="button is-ghost is-fullwidth"
                      >
                        {column.toUpperCase()}
                        <span className="icon ml-2">
                          <i
                            data-cy="SortIcon"
                            className={cn('fas', {
                              'fa-sort': sortConfig.column !== column,
                              'fa-sort-up':
                                sortConfig.column === column &&
                                sortConfig.order === 'asc',
                              'fa-sort-down':
                                sortConfig.column === column &&
                                sortConfig.order === 'desc',
                            })}
                          />
                        </span>
                      </button>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredProducts.map(product => (
                  <tr key={product.id} data-cy="Product">
                    <td data-cy="ProductId">{product.id}</td>
                    <td data-cy="ProductName">{product.name}</td>
                    <td data-cy="ProductCategory">
                      {`${product.category.icon} - ${product.category.title}`}
                    </td>
                    <td
                      data-cy="ProductUser"
                      className={cn({
                        'has-text-link': product.owner.sex === 'm',
                        'has-text-danger': product.owner.sex === 'f',
                      })}
                    >
                      {product.owner.name}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};
