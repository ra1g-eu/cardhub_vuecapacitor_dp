<template>
  <v-app-bar><v-toolbar-title><v-icon icon="mdi-card-search-outline"></v-icon> CardHub</v-toolbar-title></v-app-bar>
  <v-container class="mt-15">
    <v-row justify="center" v-if="enterSystemAlertMessage !== ''" class="mt-15 mb-15">
      <v-col cols="4">
        <v-alert class="pa-2 ma-2" type="info" icon="fas fa-info-circle" variant="outlined">
          <v-alert-title>{{ this.enterSystemAlertMessage }}</v-alert-title>
        </v-alert>
      </v-col>
    </v-row>
      <v-row justify="center">
        <v-col cols="12" lg="4" md="4" sm="12">
          <v-card rounded>
            <v-card-title>
              Vlož prihlasovací kód:
            </v-card-title>
            <v-card-text>
              <v-text-field
                  placeholder="Kód"
                  variant="outlined"
                  single-line
                  type="text"
                  clearable
                  active
                  id="loginField"
                  v-model="enterSystemCode"
              ></v-text-field>
            </v-card-text>
            <v-card-actions>
              <v-btn
                  color="green"
                  append-icon="mdi-login"
                  variant="text"
                  @click="enterSystem"
              >Prihlásiť sa
              </v-btn>
            </v-card-actions>
          </v-card>
        </v-col>
        </v-row>
    <v-row justify="center" class="mt-15">
        <v-col cols="12" lg="4" md="4" sm="12">
          <v-card rounded>
            <v-card-title>
              Nemáš ešte účet? Vytvor si nový:
            </v-card-title>
            <v-card-text>
              <v-text-field
                  placeholder="Vlož svoj vlastný kód..."
                  counter="20"
                  :rules="registerRules"
                  variant="outlined"
                  single-line
                  type="text"
                  :suffix="randomSuffix"
                  clearable
                  active
                  id="registerField"
                  v-model="registerCode"
              ></v-text-field>
              <div>
                <div class="text-caption mb-8">
                  Vyber maximálny počet aktívnych používateľov
                </div>
                <v-slider
                    v-model="maxUsersSlider"
                    min="1"
                    max="20"
                    step="1"
                    color="orange"
                    append-icon="mdi-account-group"
                    show-ticks
                    track-size="15"
                    thumb-label="always"
                ></v-slider>
              </div>
              <v-alert v-if="registerAlert" type="success">Účet vytvorený! Na prihlásenie používaj kód: <strong>{{this.enterSystemCode}}</strong></v-alert>
            </v-card-text>
            <v-card-actions>
              <v-btn
                  color="green"
                  append-icon="mdi-account-plus"
                  variant="text"
                  @click="createAccount"
              >Vytvoriť účet
              </v-btn>
            </v-card-actions>
          </v-card>
        </v-col>
      </v-row>
  </v-container>
</template>

<script>
export default {
  name: "LoginPage",
  data() {
    return {
      maxUsersSlider: 1,
      enterSystemCode: "",
      enterSystemAlertMessage: "",
      registerCode: "",
      randomSuffix: "",
      registerRules: [v => v.length <= 20 || 'Najviac 20 znakov'],
      registerAlert: false,
    }
  },
  methods: {
    createAccount(){
      this.enterSystemAlertMessage = "";
      this.registerAlert = false;
      if(this.registerCode && this.randomSuffix && this.maxUsersSlider){
        if(this.registerCode.length <= 20 && this.maxUsersSlider <= 20){
          this.$axios.post(this.$apiUrl + "api/cardhub/registerNewAccount/", {
            "registrationCode":this.registerCode+this.randomSuffix,
            "maxUsersLimit":this.maxUsersSlider
          }).then(response => {
            if (response.data.status === 'error') {
              console.log(response.data.message);
              this.enterSystemAlertMessage = response.data.message;
            } else {
              this.enterSystemCode = this.registerCode+this.randomSuffix;
              this.registerAlert = true;
              this.registerCode = "";
              this.randomSuffix = "";
            }
          }).catch(err => {
            this.enterSystemAlertMessage = err.response.data.message;
          })
        }
      }
    },
    enterSystem() {
      if (this.enterSystemCode) {
        this.enterSystemAlertMessage = "";
        this.$axios.get(this.$apiUrl + "api/cardhub/enterSystemWithCode/"+this.enterSystemCode.trim().split('#')[0] + "/"+this.enterSystemCode.trim().split('#')[1], {
          headers: {
            'Authorization': `SystemCode ${this.enterSystemCode.trim()}`
          }
        }).then(response => {
          if (response.data.status === 'error') {
            console.log(response.data.message);
            this.enterSystemAlertMessage = response.data.message;
          } else {
            localStorage.setItem('CardHub_LoginCode', this.enterSystemCode.trim());
            localStorage.setItem('CardHub_MyCards', JSON.stringify(response.data.message));
            this.$router.push({path: '/moje-karty'});
          }
        }).catch(err => {
          this.enterSystemAlertMessage = err.response.data.message;
        })
      } else {
        this.enterSystemAlertMessage = "Prosím zadaj prihlasovací kód.";
      }
    }
  },
  mounted() {
    let uuid = self.crypto.randomUUID();
    this.randomSuffix = "#"+uuid.substring(9, 13).toUpperCase();
    if(this.$route.params.sharedLogin && this.$route.params.code){
      this.enterSystemCode = this.$route.params.code.trim();
      this.enterSystemAlertMessage = "Prihlasovací kód aplikovaný! Môžeš sa prihlásiť.";
    }
    if (localStorage.getItem('CardHub_LoginCode')) {
      this.$router.push({path: '/moje-karty'});
    }
  },
}
</script>