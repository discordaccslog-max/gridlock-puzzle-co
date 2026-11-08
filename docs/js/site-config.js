/*
 * Gridlock Puzzle Co. site settings.
 * supportEmail: when set (for example 'help@yourdomain.com'), the Contact page and the footer
 * show it as a mailto link. When it is empty, those lines are simply not shown.
 */
(function (root) {
  var config = {
    supportEmail: '',
  };
  if (typeof module !== 'undefined' && module.exports) module.exports = config;
  else root.GRIDLOCK_CONFIG = config;
})(this);
