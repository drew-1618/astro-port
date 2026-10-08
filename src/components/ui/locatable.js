/*
 * Props that make a whole card act as a "slew to this star" button (mouse,
 * touch and keyboard) without nesting interactive elements inside a <button>.
 */
export function locatable(id, onLocate) {
  if (!onLocate) return {};
  return {
    role: 'button',
    tabIndex: 0,
    onClick: () => onLocate(id),
    onKeyDown: (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        onLocate(id);
      }
    },
  };
}
