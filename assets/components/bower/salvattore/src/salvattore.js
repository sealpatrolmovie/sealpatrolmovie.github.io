var salvattore = (function (global, document, undefined) {
"use strict";

var self = {}
  , grids = []
;


self.obtain_grid_settings = function obtain_grid_settings(element) {
  // returns the number of columns and the classes a column should have,
  // from computing the style of the ::before pseudo-element of the grid.

  var computedStyle = global.getComputedStyle(element, ":before")
    , content = computedStyle.getPropertyValue("content").slice(1, -1)
    , matchResult = content.match(/^\s*(\d+)(?:\s?\.(.+))?\s*$/)
    , numberOfColumns
    , columnClasses
  ;

  if (matchResult) {
    numberOfColumns = matchResult[1];
    columnClasses = matchResult[2];
    columnClasses = columnClasses? columnClasses.split(".") : ["column"];
  } else {
    matchResult = content.match(/^\s*\.(.+)\s+(\d+)\s*$/);
    columnClasses = matchResult[1];
    numberOfColumns = matchResult[2];
    if (numberOfColumns) {
      numberOfColumns = numberOfColumns.split(".");
    }
  }

  return {
    numberOfColumns: numberOfColumns,
    columnClasses: columnClasses
  };
};


self.add_columns = function add_columns(grid, items) {
  // from the settings obtained, it creates columns with
  // the configured classes and adds to them a list of items.

  var settings = self.obtain_grid_settings(grid)
    , numberOfColumns = settings.numberOfColumns
    , columnClasses = settings.columnClasses
    , columnsItems = new Array(+numberOfColumns)
    , columnsFragment = document.createDocumentFragment()
    , i = numberOfColumns
    , selector
  ;

  while (i-- !== 0) {
    selector = "[data-columns] > *:nth-child(" + numberOfColumns + "n-" + i + ")";
    columnsItems.push(items.querySelectorAll(selector));
  }

  columnsItems.forEach(function append_to_grid_fragment(rows) {
    var column = document.createElement("div")
      , rowsFragment = document.createDocumentFragment()
    ;

    column.className = columnClasses.join(" ");

    Array.prototype.forEach.call(rows, function append_to_column(row) {
      rowsFragment.appendChild(row);
    });
    column.appendChild(rowsFragment);
    columnsFragment.appendChild(column);
  });

  grid.appendChild(columnsFragment);
  grid.dataset.columns = numberOfColumns;
};


self.remove_columns = function remove_columns(grid) {
  // removes all the columns from a grid, and returns a list
  // of items sorted by the ordering of columns.

  var range = document.createRange();
  range.selectNodeContents(grid);

  var columns = Array.prototype.filter.call(range.extractContents().childNodes, function filter_elements(node) {
    return node instanceof global.HTMLElement;
  });

  var numberOfColumns = columns.length
    , numberOfRowsInFirstColumn = columns[0].childNodes.length
    , sortedRows = new Array(numberOfRowsInFirstColumn * numberOfColumns)
  ;

  Array.prototype.forEach.call(columns, function iterate_columns(column, columnIndex) {
    Array.prototype.forEach.call(column.children, function iterate_rows(row, rowIndex) {
      sortedRows[rowIndex * numberOfColumns + columnIndex] = row;
    });
  });

  var container = document.createElement("div");
  container.dataset.columns = 0;

  sortedRows.filter(function filter_non_null(child) {
    return !!child;
  }).forEach(function append_row(child) {
    container.appendChild(child);
  });

  return container;
};


self.recreate_columns = function recreate_columns(grid) {
  // removes all the columns from the grid, and adds them again,
  // it is used when the number of columns change.

  global.requestAnimationFrame(function render_after_css_media_query_change() {
    self.add_columns(grid, self.remove_columns(grid));
  });
};


self.media_query_change = function media_query_change(mql) {
  // recreates the columns when a media query matches the current state
  // of the browser.

  if (mql.matches) {
    Array.prototype.forEach.call(grids, self.recreate_columns);
  }
};


self.get_css_rules = function get_css_rules(stylesheet) {
  // returns a list of css rules from a stylesheet

  var cssRules;
  try {
    cssRules = stylesheet.sheet.cssRules;
  } catch (e) {
    return [];
  }

  return cssRules || [];
};


self.get_stylesheets = function get_stylesheets() {
  // returns a list of all the styles in the document (that are accessible).

  return Array.prototype.concat.call(
    Array.prototype.slice.call(document.querySelectorAll("style[type='text/css']")),
    Array.prototype.slice.call(document.querySelectorAll("link[rel='stylesheet']"))
  );
};


self.media_rule_has_columns_selector = function media_rule_has_columns_selector(rules) {
  // checks if a media query css rule has in its contents a selector that
  // styles the grid.

  var i = rules.length
    , rule
  ;

  while (i--) {
    rule = rules[i];
    if (rule.selectorText.match(/\[data-columns\](.*)::?before$/)) {
      return true;
    }
  }

  return false;
};


self.scan_media_queries = function scan_media_queries() {
  // scans all the stylesheets for selectors that style grids,
  // if the matchMedia API is supported.

  var mediaQueries = [];

  if (!global.matchMedia) {
    return;
  }

  self.get_stylesheets().forEach(function extract_rules(stylesheet) {
    Array.prototype.forEach.call(self.get_css_rules(stylesheet), function filter_by_column_selector(rule) {
      if (rule.media && self.media_rule_has_columns_selector(rule.cssRules)) {
        mediaQueries.push(global.matchMedia(rule.media.mediaText));
      }
    });
  });

  mediaQueries.forEach(function listen_to_changes(mql) {
    mql.addListener(self.media_query_change);
  });
};


self.next_element_column_index = function next_element_column_index(grid) {
  // returns the index of the column where the given element must be added.

  var children = grid.children
    , m = children.length
    , highestRowCount
    , child
    , currentRowCount
    , i = children.length - 1
  ;

  for (i; i >= 0; i--) {
    child = children[i];
    currentRowCount = child.children.length;
    if (i !== 0 && highestRowCount > currentRowCount) {
      break;
    } else if (i + 1 === m) {
      i = 0;
      break;
    }

    highestRowCount = currentRowCount;
  }

  return i;
};


self.create_list_of_fragments = function create_list_of_fragments(quantity) {
  // returns a list of fragments

  var fragments = new Array(quantity)
    , i = 0
  ;

  while (i !== quantity) {
    fragments[i] = document.createDocumentFragment();
    i++;
  }

  return fragments;
};


self.append_elements = function append_elements(grid, elements) {
  // adds a list of elements to the end of a grid

  var columns = grid.children
    , numberOfColumns = columns.length
    , fragments = self.create_list_of_fragments(numberOfColumns)
    , columnIndex = self.next_element_column_index(grid)
  ;

  elements.forEach(function append_to_next_fragment(element) {
    fragments[columnIndex].appendChild(element);
    if (columnIndex === numberOfColumns - 1) {
      columnIndex = 0;
    } else {
      columnIndex++;
    }
  });

  Array.prototype.forEach.call(columns, function insert_column(column, index) {
    column.appendChild(fragments[index]);
  });
};


self.prepend_elements = function prepend_elements(grid, elements) {
  // adds a list of elements to the start of a grid

  var columns = grid.children
    , numberOfColumns = columns.length
    , fragments = self.create_list_of_fragments(numberOfColumns)
    , columnIndex = numberOfColumns - 1
  ;

  elements.forEach(function append_to_next_fragment(element) {
    var fragment = fragments[columnIndex];
    fragment.insertBefore(element, fragment.firstChild);
    if (columnIndex === 0) {
      columnIndex = numberOfColumns - 1;
    } else {
      columnIndex--;
    }
  });

  Array.prototype.forEach.call(columns, function insert_column(column, index) {
    column.insertBefore(fragments[index], column.firstChild);
  });

  // populates a fragment with n columns till the right
  var fragment = document.createDocumentFragment()
    , numberOfColumnsToExtract = elements.length % numberOfColumns
  ;

  while (numberOfColumnsToExtract-- !== 0) {
    fragment.appendChild(grid.lastChild);
  }

  // adds the fragment to the left
  grid.insertBefore(fragment, grid.firstChild);
};


self.register_grid = function register_grid (grid) {
  if (global.getComputedStyle(grid).display === "none") {
    return;
  }

  // retrieve the list of items from the grid itself
  var range = document.createRange();
  range.selectNodeContents(grid);

  var items = document.createElement("div");
  items.appendChild(range.extractContents());

  items.dataset.columns = 0;
  self.add_columns(grid, items);
  grids.push(grid);
};


self.init = function init() {
  // scans all the grids in the document and generates
  // columns from their configuration.

  var gridElements = document.querySelectorAll("[data-columns]");
  Array.prototype.forEach.call(gridElements, self.register_grid);
  self.scan_media_queries();
};


self.init();

return {
  append_elements: self.append_elements,
  prepend_elements: self.prepend_elements,
  register_grid: self.register_grid
};

})(window, window.document);
