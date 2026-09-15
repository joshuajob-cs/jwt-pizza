/**
 * @fileoverview The one place pages get the pizza service from.
 *
 * Pages import `pizzaService` from here instead of importing httpPizzaService directly. The variable is
 * typed as the PizzaService interface, so a different implementation (such as a fake for tests) can be
 * swapped in at this single line without changing any page.
 */
import httpPizzaService from './httpPizzaService';
import { PizzaService } from './pizzaService';

let pizzaService: PizzaService = httpPizzaService;
export { pizzaService };
