import './app.css';
import { mount } from 'svelte';
import App from './App.svelte';
import { getTool, defaultTool } from './shell/tools';

// Start fetching the default tool alongside the shell.
void getTool(defaultTool)?.load();

const target = document.getElementById('app');
if (!target) throw new Error('missing #app');

mount(App, { target });
