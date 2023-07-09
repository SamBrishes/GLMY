
//import { invoke } from "@tauri-apps/api/tauri";
import { appWindow } from '@tauri-apps/api/window'

import './components/glmy-app';
import './components/glmy-notes';
import './components/glmy-sidebar';

import './components/night-context';
import './components/night-editor';
import './components/night-index';
import './components/night-modal';
import './components/night-tooltip';


window.addEventListener("DOMContentLoaded", () => {
    document.querySelector('[data-window-action="minimize"]')?.addEventListener('click', 
        () => appWindow.minimize()
    );
    
    document.querySelector('[data-window-action="maximize"]')?.addEventListener('click', 
        () => appWindow.toggleMaximize()
    );
    
    document.querySelector('[data-window-action="close"]')?.addEventListener('click', 
        () => appWindow.close()
    );
});
