import LoginPage from "@/components/LoginPage";
import ShowCards from "@/components/ShowCards";
import NewCard from "@/components/NewCard";
import DisplayCard from "@/components/DisplayCard";
import ExchangeRates from "@/components/ExchangeRates";

export const routes = [
  {
    path: '/:sharedLogin?/:code?',
    name: 'home',
    component: LoginPage
  },
  {
    path: '/moje-karty',
    name: 'showCards',
    component: ShowCards
  },
  {
    path: '/nova-karta',
    name: 'newCard',
    component: NewCard
  },
  {
    path: '/karta/:id',
    name: 'displayCard',
    component: DisplayCard
  },
  {
    path: '/prevodnik',
    name: 'exchangeRates',
    component: ExchangeRates
  },
]