import { css } from 'lit-element';
export const mainAppStyle = css`
  @font-face {
      font-family: 'INGMe';
      src: url('./assets/INGMeWeb-Regular.woff2') format('woff2');
  }
  
  .app {
      font-family: 'INGMe', sans-serif;
      width: 100%;
      height: 100%;
      user-select: none;
      display: flex;
      flex-direction: column;
      position: relative;
      font-size: 1.1em;
      background-color: var(--app-bg-color);
      color: var(--app-text-color);
  }
  
  .app>.header {
      display: flex;
      align-items: center;
      font-size: 14px;
      position: relative;
      outline: 1px solid var(--divider-color);
      color: var(--title-text-color);
  }
  
  .container {
      height: calc(100% - 60px);
      position: relative;
      overflow: hidden;
      flex: 1;
  }
  
  .action-header {
      display: flex;
      align-items: center;
      padding: 0 8px;
      font-size: 12px;
      border-bottom: 1px solid var(--divider-color);      
      height: 32px;
  }
  
  .search {
      display: flex;
      align-items: center;
      flex: 1;
      font-size: 16px;
      background-color: var(--app-bg-color);
      color: var(--app-text-color);
      outline: none;
      border: 0;
      margin: 3px;            
  }
  
  .search:hover {
    box-shadow: var(--focus-ring-inactive-shadow);
  }
  
  .search:focus{
    box-shadow: var(--focus-ring-active-shadow);
  }
  
  .scroll {
      position: relative;
      flex: 1;
      overflow: auto;
  }
  
  .notice {
      display: flex;
      align-items: center;
      height: 100%;
      width: 100%;
      color: #aaa;
  }
  
  .notice div {
      text-align: center;
      padding: 0.5em;
      margin: 0 auto;
  }
  
  .logo {
      width: 48px;
      height: 48px;
      margin: 0 4px;
      background: url('./assets/images/grass-hopper-logo.png') no-repeat center center;
      background-size: 48px;
  }
  
  .message-container {
      height: 1em;
      cursor: default;
      display: block;
  }
  
  .message-container .title {
      color: var(--app-text-color);
      font-size: 16px;
  }
  
  .message {
      color: darkblue;
      position: absolute;
      display: flex;
      align-items: center;
  }
  
  .actions {
      flex: auto 1 1;
      display: flex;
      justify-content: flex-end;
  }
  
  .ui-group {
      display: inline-block;
      vertical-align: middle;
      position: relative;
  }
  
  .ui-group>.content-wrapper {
      position: relative;
  }
  
  .ui-group>.content-wrapper>.content {
      display: flex;
      flex-direction: row;
      align-items: stretch;
      justify-content: center;
  }
  
  .ui-button {
      display: inline-block;
      vertical-align: middle;
      border: none;
      font-family: inherit;
      text-decoration: none;
      cursor: pointer;
      user-select: none;
      position: relative;
      box-sizing: border-box;
      border-radius: 3px;
      padding: 0 14px;
      font-size: 14px;
      line-height: 16px;
      height: 32px;
      color: #2c3e50;
      background: #e0f8ed;
  }
  
  .component-tree-container, .property-tree-container {
      padding: 8px;
  }
`;
