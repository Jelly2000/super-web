// Module Federation requires an async boundary at the entry point so the
// shared scope is initialized before any shared/federated module is imported.
import('./bootstrap');
