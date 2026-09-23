import * as ts from 'typescript';
import {
  manualStepHtml,
  manualStepTs,
  patchMainComponentHtml,
  patchMainComponentTs,
  patchSectionModule,
  patchStoreIndex,
  patchStoreModule,
} from '../../schematics/persistence/patches';

/**
 * Schematic `persistence`: aggiunge la persistenza a una sezione gia' generata. Le modifiche sono
 * funzioni pure sul testo dei file (testate qui); dove un file e' stato modificato a mano e il punto
 * d'aggancio non si trova, la patch inserisce un marcatore che NON compila, cosi' `ng build` indica
 * esattamente cosa completare a mano.
 */

/** Errori di sintassi TypeScript (non di tipo): la patch non deve mai produrre codice malformato. */
function syntaxErrors(code: string): readonly ts.Diagnostic[] {
  const source = ts.createSourceFile('x.ts', code, ts.ScriptTarget.Latest, true);
  return (source as unknown as {parseDiagnostics: ts.Diagnostic[]}).parseDiagnostics;
}

// Fixture: file generati dalla v19.2.6 (master) per clazz = Coin.
const STORE_MODULE = `import {InjectionToken, NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import {ActionReducer, StoreModule} from '@ngrx/store';
import {EffectsModule} from '@ngrx/effects';
import {CoinStoreEffects} from './coin.effects';
import {featureReducer} from './coin.reducer';
import {State} from './coin.state';
import {Names} from './coin.names';

export const INJECTION_TOKEN = new InjectionToken<ActionReducer<State>>(\`\${Names.NAME}-store Reducers\`);

@NgModule({
	imports: [
		CommonModule,
		StoreModule.forFeature(Names.NAME, INJECTION_TOKEN),
		EffectsModule.forFeature([CoinStoreEffects]),
	],
	declarations: [],
	providers: [CoinStoreEffects,
		{
			provide: INJECTION_TOKEN,
			useFactory: (): ActionReducer<State> => featureReducer
		}]
})
export class CoinStoreModule {
}
`;

const STORE_INDEX = `import * as CoinStoreActions from './coin.actions';
import * as CoinStoreSelectors from './coin.selectors';

import * as CoinStoreState from './coin.state';

export {
	CoinStoreModule
} from './coin-store.module';

export {
	CoinStoreActions,
	CoinStoreSelectors,

	CoinStoreState
};
`;

const SECTION_MODULE = `import {NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import {CoinMainComponent} from './coin-main/coin-main.component';
import {ToolbarModule} from 'primeng/toolbar';
import { ConfirmDialogModule } from 'primeng/confirmdialog';

@NgModule({
  declarations: [
    CoinMainComponent
  ],
  imports: [
    CommonModule,
    ToolbarModule,
    ConfirmDialogModule
  ],
  providers: [],
})
export class CoinModule {
}
`;

const MAIN_TS = `import {Component, OnInit} from '@angular/core';
import {Store} from '@ngrx/store';
import {CoinStoreActions, RootStoreState} from '@root-store/index';
import {Actions} from 'ngrx-entity-crud';
import {Coin} from '@models/vo/coin';

@Component({
  selector: 'app-coin-main',
  templateUrl: 'coin-main.component.html',
  styles: []
})
export class CoinMainComponent implements OnInit {

  constructor(private readonly store$: Store<RootStoreState.State>) {
  }

  actions: Actions<Coin> = CoinStoreActions.actions;

  ngOnInit(): void {
  }
}
`;

const MAIN_HTML = `<p-confirmDialog />
<p-toolbar styleClass="mb-4">
  <ng-template pTemplate="left">
    <app-search [actions]="actions"></app-search>
  </ng-template>
</p-toolbar>
<app-coin-list></app-coin-list>
`;

describe('schematic persistence — marcatori di passo manuale', () => {
  it('in TypeScript e\' un identificatore non dichiarato: sintassi valida, ma non compila (TS2304)', () => {
    const marker = manualStepTs('registra CoinPersistence.effects in EffectsModule.forFeature');

    expect(syntaxErrors(marker)).toHaveLength(0);
    expect(marker).toMatch(/^\/\/ .*ngrx-entity-crud:persistence/m);
    expect(marker).toMatch(/^NEC_PASSO_MANUALE__registra_CoinPersistence_effects_in_EffectsModule_forFeature;$/m);
  });

  it('in HTML e\' un elemento sconosciuto (NG8001 in compilazione), con un commento che spiega', () => {
    const marker = manualStepHtml('avvolgi la ricerca con nec-restore-search');

    expect(marker).toContain('<!-- ngrx-entity-crud:persistence');
    expect(marker).toContain('<nec-passo-manuale-avvolgi-la-ricerca-con-nec-restore-search></nec-passo-manuale-avvolgi-la-ricerca-con-nec-restore-search>');
  });
});

describe('patchStoreModule', () => {
  it('modulo generato: import del bundle, reducer in StoreModule.forFeature ed effects in EffectsModule.forFeature', () => {
    const result = patchStoreModule(STORE_MODULE, 'Coin');

    expect(result.manual).toEqual([]);
    expect(result.content).toContain('import {CoinPersistence} from \'./coin.persistence\';');
    expect(result.content).toContain('StoreModule.forFeature(CoinPersistence.featureKey, CoinPersistence.reducer)');
    expect(result.content).toContain('EffectsModule.forFeature([CoinStoreEffects, CoinPersistence.effects])');
    expect(syntaxErrors(result.content)).toHaveLength(0);
  });

  it('idempotente: una seconda esecuzione non cambia nulla', () => {
    const once = patchStoreModule(STORE_MODULE, 'Coin').content;
    const twice = patchStoreModule(once, 'Coin');

    expect(twice.content).toBe(once);
    expect(twice.manual).toEqual([]);
  });

  it('effects registrati con una costante (non un array letterale): marcatore per il passo manuale', () => {
    const modified = STORE_MODULE.replace('EffectsModule.forFeature([CoinStoreEffects])', 'EffectsModule.forFeature(EFFECTS)');

    const result = patchStoreModule(modified, 'Coin');

    expect(result.content).toContain('StoreModule.forFeature(CoinPersistence.featureKey, CoinPersistence.reducer)');
    expect(result.manual).toHaveLength(1);
    expect(result.content).toMatch(/^NEC_PASSO_MANUALE__\w*effects\w*;$/m);
    expect(syntaxErrors(result.content)).toHaveLength(0);
  });

  it('NgModule senza array imports: marcatori per reducer ed effects', () => {
    const modified = STORE_MODULE.replace(/imports: \[[\s\S]*?\],\n/, '');

    const result = patchStoreModule(modified, 'Coin');

    expect(result.manual).toHaveLength(2);
    expect(result.content).toMatch(/^NEC_PASSO_MANUALE__\w*reducer\w*;$/m);
    expect(result.content).toMatch(/^NEC_PASSO_MANUALE__\w*effects\w*;$/m);
  });

  it('vecchio cablaggio beta (--persist con createPersistenceEffects): non aggiunge un secondo cablaggio, chiede di migrare', () => {
    const oldBeta = STORE_MODULE
      .replace('import {Names} from \'./coin.names\';', 'import {Names} from \'./coin.names\';\nimport {createPersistenceEffects} from \'ngrx-entity-crud/persistence\';')
      .replace('EffectsModule.forFeature([CoinStoreEffects])', 'EffectsModule.forFeature([CoinStoreEffects, CoinPersistenceEffects])');

    const result = patchStoreModule(oldBeta, 'Coin');

    expect(result.content).toContain('EffectsModule.forFeature([CoinStoreEffects, CoinPersistenceEffects])');
    expect(result.content).not.toContain('from \'./coin.persistence\'');
    expect(result.manual).toHaveLength(1);
    expect(result.content).toMatch(/^NEC_PASSO_MANUALE__\w*createPersistenceEffects\w*;$/m);
  });
});

describe('patchStoreIndex', () => {
  it('aggiunge l\'export del bundle, una sola volta', () => {
    const once = patchStoreIndex(STORE_INDEX, 'Coin').content;

    expect(once).toContain('export {CoinPersistence} from \'./coin.persistence\';');
    expect(patchStoreIndex(once, 'Coin').content).toBe(once);
  });
});

describe('patchSectionModule', () => {
  it('importa NecRestoreSearchComponent e lo aggiunge agli imports del NgModule', () => {
    const result = patchSectionModule(SECTION_MODULE, 'Coin');

    expect(result.manual).toEqual([]);
    expect(result.content).toContain('import {NecRestoreSearchComponent} from \'ngrx-entity-crud/persistence-ui\';');
    expect(result.content).toMatch(/ConfirmDialogModule,\s*NecRestoreSearchComponent\s*\]/);
    expect(syntaxErrors(result.content)).toHaveLength(0);
    expect(patchSectionModule(result.content, 'Coin').content).toBe(result.content);
  });

  it('NgModule senza array imports: marcatore', () => {
    const result = patchSectionModule(SECTION_MODULE.replace(/imports: \[[\s\S]*?\],\n/, ''), 'Coin');

    expect(result.manual).toHaveLength(1);
    expect(result.content).toMatch(/^NEC_PASSO_MANUALE__\w*NecRestoreSearchComponent\w*;$/m);
  });
});

describe('patchMainComponentTs', () => {
  it('importa CoinPersistence da @root-store/index e lo espone come proprieta\' persistence', () => {
    const result = patchMainComponentTs(MAIN_TS, 'Coin');

    expect(result.manual).toEqual([]);
    expect(result.content).toContain('import {CoinPersistence} from \'@root-store/index\';');
    expect(result.content).toMatch(/export class CoinMainComponent implements OnInit \{\n\n {2}persistence = CoinPersistence;\n/);
    expect(syntaxErrors(result.content)).toHaveLength(0);
    expect(patchMainComponentTs(result.content, 'Coin').content).toBe(result.content);
  });

  it('classe rinominata a mano: marcatore', () => {
    const result = patchMainComponentTs(MAIN_TS.replace('class CoinMainComponent', 'class CoinPageComponent'), 'Coin');

    expect(result.manual).toHaveLength(1);
    expect(result.content).toMatch(/^NEC_PASSO_MANUALE__\w*persistence\w*;$/m);
  });
});

describe('patchMainComponentHtml', () => {
  it('avvolge <app-search> con <nec-restore-search [persistence]="persistence">', () => {
    const result = patchMainComponentHtml(MAIN_HTML);

    expect(result.manual).toEqual([]);
    expect(result.content).toMatch(
      /<nec-restore-search \[persistence\]="persistence">\s*<app-search \[actions\]="actions"><\/app-search>\s*<\/nec-restore-search>/
    );
    expect(patchMainComponentHtml(result.content).content).toBe(result.content);
  });

  it('ricerca sostituita a mano (nessun <app-search>): marcatore in cima al template', () => {
    const result = patchMainComponentHtml(MAIN_HTML.replace('<app-search [actions]="actions"></app-search>', '<my-search></my-search>'));

    expect(result.manual).toHaveLength(1);
    expect(result.content.startsWith('<!-- ngrx-entity-crud:persistence')).toBe(true);
    expect(result.content).toContain('<nec-passo-manuale-');
  });

  it('piu\' di un <app-search>: non sceglie a caso, marcatore', () => {
    const doubled = MAIN_HTML.replace('<app-search [actions]="actions"></app-search>', '<app-search [actions]="actions"></app-search><app-search [actions]="other"></app-search>');

    expect(patchMainComponentHtml(doubled).manual).toHaveLength(1);
  });
});
