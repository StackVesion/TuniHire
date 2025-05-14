// Action types
export const SET_PAGE_TITLE = 'SET_PAGE_TITLE';

// Action creator for setting page title
export const setPageTitle = (title: string) => {
  // Set the document title
  document.title = `${title} | TuniHire Admin`;
  
  // Return the action for Redux
  return {
    type: SET_PAGE_TITLE,
    payload: title
  };
};
