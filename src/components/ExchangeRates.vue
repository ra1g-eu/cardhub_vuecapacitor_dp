<template>
  <v-app-bar prominent app density="comfortable" color="black">
    <v-toolbar-title>Prevodník kurzov</v-toolbar-title>
  </v-app-bar>
  <v-container class="mt-10" id="contScr">
    <v-row justify="center" class="pa-0 ma-0">
      <v-col
          class="text-center"
          cols="12"
      >
        <strong class="text-h6">Suma pre skonvertovanie</strong>
      </v-col>
      <v-container>
        <v-row justify="center">
          <v-col
              xl="4"
              lg="4"
              md="6"
              sm="12">
            <v-text-field
                :label="Suma"
                v-model="currencyAmount"
                variant="outlined"
                hide-details
                single-line
                placeholder="Napíš sumu"
            ></v-text-field>
          </v-col>
        </v-row>
      </v-container>
    </v-row>
    <v-row justify="center" class="pa-0 ma-0">
      <v-container>
        <v-row justify="center">
          <v-col cols="12" sm="12"
                 md="8" lg="4" xl="4">
            <v-expansion-panels color="black">
              <v-expansion-panel bg-color="black">
                <v-expansion-panel-title>
                  Zadaj číslo kliknutím sem
                </v-expansion-panel-title>
                <v-expansion-panel-text>
                  <v-row justify="center">
                    <v-col sm="4" md="4" lg="3" xl="3" v-for="(button, index) in buttons" :key="index">
                      <v-card
                          height="55"
                          hover
                          @click="addNumber(button)"
                      >
                        <v-card-text
                            class="text-h5 flex-grow-1 text-center align-center align-self-center">
                          <div v-if="button === 'C'">
                            <v-icon icon="mdi-delete" color="red" size="small"></v-icon>
                          </div>
                          <div v-else-if="button === 'B'">
                            <v-icon icon="mdi-backspace" color="warning" size="small"></v-icon>
                          </div>
                          <div v-else>
                            {{ button }}
                          </div>
                        </v-card-text>
                      </v-card>
                    </v-col>
                  </v-row>
                </v-expansion-panel-text>
              </v-expansion-panel>
            </v-expansion-panels>
          </v-col>
        </v-row>
      </v-container>
    </v-row>
    <v-row justify="center">
      <v-item-group v-model="selectionFrom" mandatory>
        <v-container>
          <v-row dense>
            <v-col
                class="text-center"
                cols="12"
            >
              <strong class="text-h6">Konvertovať z:</strong>
            </v-col>
            <v-col
                v-for="(currency, index) in currenciesFrom"
                :key="index"
                xl="4"
                lg="4"
                sm="6"
                md="6"

            >
              <v-item v-slot="{ isSelected, toggle }">
                <v-card
                    :color="isSelected ? 'white' : 'black'"
                    @click="toggle"
                >
                  <v-card-text
                      class="text-h4 flex-grow-1 text-center"
                  >
                    {{ currency }}
                  </v-card-text>
                </v-card>
              </v-item>
            </v-col>
          </v-row>
        </v-container>
      </v-item-group>
    </v-row>
    <v-row justify="center">
      <v-item-group v-model="selectionTo" mandatory>
        <v-container>
          <v-row dense>
            <v-col
                class="text-center"
                cols="12"
            >
              <strong class="text-h6">Konvertovať na:</strong>
            </v-col>
            <v-col
                v-for="(currency, index) in currenciesTo"
                :key="index"
                xl="4"
                lg="4"
                sm="6"
                md="6"

            >
              <v-item v-slot="{ isSelected, toggle }">
                <v-card
                    :color="isSelected ? 'white' : 'black'"
                    @click="toggle"
                >
                  <v-card-text
                      class="text-h4 flex-grow-1 text-center"
                  >
                    {{ currency }}
                  </v-card-text>
                </v-card>
              </v-item>
            </v-col>
          </v-row>
        </v-container>
      </v-item-group>
    </v-row>
    <v-row justify="center">
      <v-col
          class="text-center"
          cols="12"
      >
        <strong class="text-h6">Výsledok:</strong>
      </v-col>
      <v-col
          xl="3"
          lg="3"
          sm="6"
          md="6"
      >
        <v-card
            color="black"
            class="pa-0"
        >

          <v-card-text
              class="text-h5 flex-grow-1 text-center" v-if="currencyAmount >= 0.00001"
          >
            <strong>{{ currencyAmount }}</strong> <span class="text-h6">{{ currenciesFrom.at(selectionFrom) }}</span>
            <v-icon icon="mdi-arrow-right" size="small"></v-icon>
            <strong>{{ convertedAmount }}</strong> <span class="text-h6">{{ currenciesTo.at(selectionTo) }}</span>
          </v-card-text>
          <v-card-text
              class="text-h5 flex-grow-1 text-center" v-else
          >
            <v-icon icon="mdi-all-inclusive" size="small"></v-icon>
          </v-card-text>
        </v-card>
        <v-card-text>
          <p class="text-center text-caption text-medium-emphasis">1 {{ currenciesFrom.at(selectionFrom) }} <v-icon icon="mdi-arrow-right" size="small"></v-icon>
            {{ currenciesFrom.at(selectionFrom) == currenciesTo.at(selectionTo) ? '1' : (convertedAmount/this.currencyAmount).toFixed(3)}} {{currenciesTo.at(selectionTo) }}</p>
        </v-card-text>
      </v-col>
    </v-row>
  </v-container>
  <v-footer class="mb-12" color="black">
    <v-card
        color="black"
        elevation="0"
        rounded="0"
        width="100%"
        class="text-center"
    >
      <v-card-text>
        <p class="text-center text-medium-emphasis">Kurz aktualizovaný: {{ new Date(parseInt(this.lastUpdate)).toLocaleString()}}</p>
      </v-card-text>
    </v-card>
  </v-footer>
  <v-spacer></v-spacer>
  <v-bottom-navigation
      id="bottomNav3"
      hide-on-scroll
      bg-color="black"
      scroll-target="#contScr"
      grow
  >
    <v-btn
        variant="text"
        @click="refreshRates"
    >
      <span>Obnoviť kurz</span>

      <v-icon>mdi-refresh</v-icon>
    </v-btn>

    <v-btn
        variant="text"
        @click="this.$router.push({path: '/moje-karty'});"
    >
      <span>Moje karty</span>

      <v-icon>mdi-credit-card-outline</v-icon>
    </v-btn>
  </v-bottom-navigation>
</template>

<script>
import Swal from "sweetalert2";

export default {
  name: "ExchangeRates",
  data(){
    return{
      lastUpdate: null,
      currencyAmount: '0',
      currencyResult: 0,
      selectionFrom: "",
      selectionTo: "",
      currenciesFrom: ["EUR", "USD", "GBP", "CZK", "TRY"],
      currenciesTo: ["EUR", "USD", "GBP", "CZK", "TRY"],
      conversionRate: 0,
      buttons: ["1", "2", "3", "4", "5", "6", "7", "8", "9", "0", 'B', "C"],
    }
  },
  computed: {
    convertedAmount() {
      let result = this.currencyResult;
      let regExp = /^0[0-9].*$/
      let cRate = this.conversionRate;
      if (this.selectionFrom !== "" && this.selectionTo !== "" && this.currencyAmount != null) {
        if (this.currenciesFrom.at(this.selectionFrom).trim() === this.currenciesTo.at(this.selectionTo).trim()) {
          return cRate = 1;
        } else {
          if (!regExp.test(this.currencyAmount) && this.currencyAmount >= 0) {
            if (this.selectionFrom !== "" && this.selectionTo !== "") {
              if(localStorage.getItem("ExchangeRates_ERA")){
                let rates = JSON.parse(localStorage.getItem("ExchangeRates_ERA"));
                for(let rate of rates){
                  if(rate.curr_from == this.currenciesFrom.at(this.selectionFrom).trim() && rate.curr_to == this.currenciesTo.at(this.selectionTo).trim()){
                    cRate = rate.currencyRate;
                    result = this.currencyAmount * cRate;
                    return result.toFixed(2);
                  }
                }
              } else {
                result = this.currencyAmount * this.conversionRate;
                return result.toFixed(2);
              }
            }
          }
        }
      }
      return result.toFixed(0);
    }
  },
  methods: {
    addNumber(number){
      let regExp = /^0[0-9].*$/
      if(number === 'B'){
        this.currencyAmount = this.currencyAmount.toString().slice(0, -1);
        this.currencyAmount = parseFloat(this.currencyAmount);
      }
      if(number === 'C'){
        this.currencyAmount = 0;
      }
      if(!this.currencyAmount.toString().startsWith('.') && this.currencyAmount >= 0){
        if(regExp.test(this.currencyAmount)) {
          this.currencyAmount = 0;
        } else {
          this.currencyAmount = this.currencyAmount.toString().concat(number);
          this.currencyAmount = parseFloat(this.currencyAmount);
        }
      }
    },
    async refreshRates(){
      if((Date.now() - parseInt(localStorage.getItem('LastRefresh_ERA'))) >= 259200000){
        try {
          await this.$axios.get(this.$apiUrl + "api/exchange/getAllConversionRates/",{
            headers: {
              'App-Request-Header': `ExchangeRatesApp/REQ/ERA/1.0.0`
            }
          }).then(response => {
            if (response.data.status == 'success') {
              localStorage.setItem("ExchangeRates_ERA", JSON.stringify(response.data.message));
            }
          });
        } catch (err) {
          Swal.fire({
            title: 'Chyba',
            text: 'Pravdepodobne nie nemáš prístup na internet. Skús to znova neskôr.',
            icon: "warning",
            confirmButtonText: 'OK',
          }).then((result) => {
            if (result.isConfirmed) {
              Swal.close();
            }
          });
        }
      } else {
        Swal.fire({
          title: 'Chyba',
          html: 'Obnovenie je dostupné každé 3 dni. Prosím skús to znova v tento dátum:' + '<br>' + new Date(parseInt(this.lastUpdate)+259200000).toLocaleString(),
          icon: "warning",
          confirmButtonText: 'OK',
        }).then((result) => {
          if (result.isConfirmed) {
            Swal.close();
          }
        });
      }
    },
    async refreshAuto(){
      try {
        await this.$axios.get(this.$apiUrl + "api/exchange/getAllConversionRates/",{
          headers: {
            'App-Request-Header': `ExchangeRatesApp/REQ/ERA/1.0.0`
          }
        }).then(response => {
          if (response.data.status == 'success') {
            console.log(response.data.message);
            localStorage.setItem("ExchangeRates_ERA", JSON.stringify(response.data.message));
          }
        });
      } catch (err) {
        Swal.fire({
          title: 'Chyba',
          html: 'Nebolo možné obnoviť kurz. Pravdepodobne chyba internetového spojenia. Skús to neskôr.',
          icon: "warning",
          confirmButtonText: 'OK',
        }).then((result) => {
          if (result.isConfirmed) {
            Swal.close();
          }
        });
      }
    }
  },
  mounted() {
    if(!localStorage.getItem('LastRefresh_ERA')){
      this.refreshAuto();
      localStorage.setItem("LastRefresh_ERA", Date.now().toString());
    } else if((Date.now() - parseInt(localStorage.getItem('LastRefresh_ERA'))) >= 259200000){
      this.refreshAuto();
      localStorage.setItem("LastRefresh_ERA", Date.now().toString());
    }
    document.title = "CardHub - prevodník kurzov";
    this.lastUpdate = localStorage.LastRefresh_ERA;
  },
}
</script>

<style scoped>

</style>