import PlacementOverlay from "./PlacementOverlay.svelte.js";

export default class {
  toolData = $state(null);
  buildingData = $state(null);

  playerTick = $state(null);
  lastPlayerTick = $state(null);

  buildings = $state({});
  factory = $state(null);

  mousePosition = $state({
    x: 0,
    y: 0,
  });

  playerPartyMembers = $state([]);
  playerPartyLeader = $state(0);
  playerPartyCanSell = $state(false);
  playerPartyCanPlace = $state(false);

  isDisplayingMenu = $state(null);

  constructor(game) {
    this.game = game;
    this.hasInitialised = false;
    this.PlacementOverlay = new PlacementOverlay(this.game);
  }
  init() {
    if (!this.hasInitialised) {
      this.hasInitialised = true;
      this.game.eventEmitter.on(
        "BuildingInfoRpcReceived",
        this.onBuildingDataReceived.bind(this),
      );
      this.game.eventEmitter.on(
        "ToolInfoRpcReceived",
        this.onItemDataReceived.bind(this),
      );
      this.game.eventEmitter.on("EnterWorldResponse", this.onEnterWorld.bind(this));
      this.game.eventEmitter.on(
        "PartyMembersUpdatedRpcReceived",
        this.onPartyInfoUpdate.bind(this),
      );
      this.game.eventEmitter.on(
        "PartyBuildingRpcReceived",
        this.onPartyBuildingUpdate.bind(this),
      );
      this.game.eventEmitter.on("mouseMoved", this.onMouseMoved.bind(this));
      this.game.eventEmitter.on("mouseUp", this.onMouseUp.bind(this));
      this.game.eventEmitter.on("mouseDown", this.onMouseDown.bind(this));
      this.game.eventEmitter.on("rightMouseUp", this.onRightMouseUp.bind(this));
      /*
          this.game.eventEmitter.on("SocketOpened", this.onSocketOpened.bind(this)),
          this.game.eventEmitter.on("SocketClosed", this.onSocketClosed.bind(this)),
          this.game.eventEmitter.on("EnterWorldResponse", this.onEnterWorld.bind(this)),
          this.game.eventEmitter.on("BuildingInfoRpcReceived", this.onBuildingDataReceived.bind(this)),
          this.game.eventEmitter.on("ToolInfoRpcReceived", this.onItemDataReceived.bind(this)),
          this.game.eventEmitter.on("PartyMembersUpdatedRpcReceived", this.onPartyInfoUpdate.bind(this)),
          this.game.eventEmitter.on("mouseMoved", this.onMouseMoved.bind(this)),
          this.game.eventEmitter.on("mouseUp", this.onMouseUp.bind(this)),
          this.game.eventEmitter.on("mouseDown", this.onMouseDown.bind(this)),
          this.game.eventEmitter.on("rightMouseUp", this.onRightMouseUp.bind(this)),
          this.game.eventEmitter.on("PartyBuildingRpcReceived", this.onPartyBuildingUpdate.bind(this)),
          window.addEventListener("beforeunload", this.onBeforeUnload),
          */
      this.PlacementOverlay.init();
      window.addEventListener("keydown", (t) => {
        "Space" == t.code && t.target == document.body && t.preventDefault();
      });
    }
  }
  onEnterWorld() {
    this.playerTick = null;

    this.factory = null;
    this.buildings = {};
  }
  onBuildingDataReceived(t) {
    this.buildingData = JSON.parse(t.json);
    for (const t in this.buildingData) {
      this.buildingData[t].built = 0;
      // this.buildingData[t].disabled = $state(false);
    }
    this.game.eventEmitter.emit("BuildingDataReceived");
  }
  onItemDataReceived(t) {
    this.toolData = JSON.parse(t.json);
    this.game.eventEmitter.emit("ToolDataReceived");
  }
  onPartyInfoUpdate(t) {
    const e = t.length,
      r = this.game.renderer.world.getLocalPlayer();
    this.playerPartyLeader = t.find((t) => true === t.isLeader).uid;
    this.playerPartyMembers = t;
    this.playerPartyCanSell = true === t.find((t) => t.uid === r).canSell;
    this.playerPartyCanPlace = true === t.find((t) => t.uid === r).canPlace;
    this.game.eventEmitter.emit("PartyMembersUpdated", t);
    for (const t in this.buildingData) {
      const r = this.buildingData[t];
      r.limit = r.limitPerMember * (!1 === r.limitStatic ? e : 1);
    }
    this.game.eventEmitter.emit("BuildingDataUpdated");
  }
  onPartyBuildingUpdate(t) {
    for (let e in t) {
      const r = t[e];
      if (1 == r.dead) {
        delete this.buildings[r.uid];
      } else {
        this.buildings[r.uid] = r;
      }
      if ("Factory" == r.type) {
        this.factory = r.dead ? null : r;
        for (const t in this.buildingData) {
          this.buildingData[t].disabled = r.dead;
        }
        this.buildingData.Factory.disabled = !r.dead;
      }
      this.buildingData[r.type].built = 0;
      for (const t in this.buildings) {
        this.buildings[t].type == r.type && this.buildingData[r.type].built++;
      }
    }
    this.game.eventEmitter.emit("BuildingsUpdated", t);
  }
  onMouseMoved({ event: t }) {
    this.mousePosition = {
      x: t.clientX,
      y: t.clientY,
    };
    this.PlacementOverlay.update();
    if (
      this.PlacementOverlay.isActive() &&
      true === this.game.inputPacketManager.mouseDown
    )
      this.PlacementOverlay.placeBuilding();
  }
  onMouseDown({ event: t }) {
    if (this.PlacementOverlay.isActive()) {
      this.PlacementOverlay.placeBuilding();
    }
    /*
      for (let t in this.components.uiTopBar.menuIcons)
          this.components.uiTopBar.menuIcons[t].hide()
          */
  }
  onMouseUp({ event: t }) {
    /* if (this.components.uiReconnection.isVisible() || this.components.uiRespawn.isVisible())
          return;
          */
    if (this.PlacementOverlay.isActive()) return;
    /*
      for (let t in this.components.uiTopBar.menuIcons)
          this.components.uiTopBar.menuIcons[t].hide();
      if ("Pickaxe" !== this.playerTick?.weaponName)
          return this.components.uiBuildingOverlay.onWorldMouseUp(t);
      if (1 == this.castingSpell)
          return;
      const e = dr.renderer.world
        , r = dr.renderer.screenToWorld(this.mousePosition.x, this.mousePosition.y)
        , n = e.entityGrid.getCellIndices(r.x, r.y, {
          width: 1,
          height: 1
      })
        , i = n.length > 0 && n[0];
      if (!1 === i)
          return;
      const o = e.entityGrid.getEntitiesInCell(i)
        , s = this.components.uiBuildingOverlay;
      for (const r in o) {
          const n = parseInt(r);
          if (n == s.buildingUid)
              return s.onWorldMouseUp(t);
          const i = e.entities[n].getTargetTick();
          for (const e in this.buildingData)
              if (e == i.model)
                  return s.onWorldMouseUp(t),
                  void s.startWatching(n)
      }
      s.onWorldMouseUp(t)
      */
  }
  onRightMouseUp({ event: t }) {
    // this.components.uiBuildingOverlay.onRightMouseUp(t),
    this.PlacementOverlay.cancelPlacing();
  }
  setPlayerTick(t) {
    this.lastPlayerTick = this.playerTick;
    this.playerTick = t;
    for (let t of ["wood", "stone", "gold", "tokens", "wave"]) {
      if (null !== this.lastPlayerTick) {
        if (this.lastPlayerTick[t] !== this.playerTick[t]) {
          this.game.eventEmitter.emit(`${t}CountUpdated`);
        }
      } else {
        this.game.eventEmitter.emit(`${t}CountUpdated`);
      }
    }
    this.game.eventEmitter.emit("PlayerTickUpdated", t);
  }
  getPlayerTick() {
    return this.playerTick;
  }
  getLastPlayerTick() {
    return this.lastPlayerTick;
  }
  showMenu(menu) {
    this.isDisplayingMenu = menu;
  }
  hideMenu() {
    this.isDisplayingMenu = null;
  }
}

/*
class Xe extends n {
  constructor() {
    super(document.getElementById("hud")),
        this.components = {},
        this.components.uiIntro = new i,
        this.components.uiIntroLeaderboard = new o,
        this.components.uiReconnection = new s,
        this.components.uiMap = new ye,
        this.components.uiBuildingBar = new h,
        this.components.uiChat = new ge,
        this.components.uiTopBar = new Re,
        this.components.uiResources = new je,
        this.components.uiPlacementOverlay = new fe,
        this.components.uiBuildingOverlay = new pe,
        this.components.uiPopupOverlay = new Be,
        this.components.uiPipOverlay = new Ce,
        this.components.uiRespawn = new Le,
        this.components.uiDayNightTicker = new De,
        this.components.uiDayNightOverlay = new Ne,
        this.components.uiAnnouncementOverlay = new Ue,
        this.components.uiLeaderboard = new ze,
        this.components.uiPartyMemberIndicator = new We,
        this.components.uiArmourIndicator = new He,
        this.components.uiActiveSpells = new Ve,
        this.components.uiWalkthrough = new Ge,
        this.components.uiInputLock = new Ye,
        this.components.uiTutorial = new Ke,
      (this.hasInitialised = !1),
      (this.playerTick = null),
      (this.lastPlayerTick = null),
      (this.factory = null),
      (this.buildings = {}),
      (this.buildingData = null),
      (this.mousePosition = {
        x: 0,
        y: 0,
      }),
      (this.playerPartyMembers = []),
      (this.playerPartyLeader = !1),
      (this.playerPartyCanSell = !1),
      (this.playerPartyCanPlace = !1);
  }
  init() {
    if (!this.hasInitialised) {
      this.hasInitialised = !0;
      for (let t in this.components) this.components[t].init && this.components[t].init();
      dr.eventEmitter.on("SocketOpened", this.onSocketOpened.bind(this)),
        dr.eventEmitter.on("SocketClosed", this.onSocketClosed.bind(this)),
        dr.eventEmitter.on("EnterWorldResponse", this.onEnterWorld.bind(this)),
        dr.eventEmitter.on(
          "BuildingInfoRpcReceived",
          this.onBuildingDataReceived.bind(this),
        ),
        dr.eventEmitter.on("ToolInfoRpcReceived", this.onItemDataReceived.bind(this)),
        dr.eventEmitter.on(
          "PartyMembersUpdatedRpcReceived",
          this.onPartyInfoUpdate.bind(this),
        ),
        dr.eventEmitter.on("mouseMoved", this.onMouseMoved.bind(this)),
        dr.eventEmitter.on("mouseUp", this.onMouseUp.bind(this)),
        dr.eventEmitter.on("mouseDown", this.onMouseDown.bind(this)),
        dr.eventEmitter.on("rightMouseUp", this.onRightMouseUp.bind(this)),
        dr.eventEmitter.on(
          "PartyBuildingRpcReceived",
          this.onPartyBuildingUpdate.bind(this),
        ),
        window.addEventListener("beforeunload", this.onBeforeUnload),
        window.addEventListener("keydown", (t) => {
          "Space" == t.code && t.target == document.body && t.preventDefault();
        });
    }
  }
  onEnterWorld() {
    (this.factory = null), (this.playerTick = null), (this.buildings = {});
  }
  onBuildingDataReceived(t) {
    this.buildingData = JSON.parse(t.json);
    for (const t in this.buildingData) this.buildingData[t].built = 0;
    dr.eventEmitter.emit("BuildingDataReceived");
  }
  onItemDataReceived(t) {
    (this.toolData = JSON.parse(t.json)), dr.eventEmitter.emit("ToolDataReceived");
  }
  onPartyInfoUpdate(t) {
    const e = t.length,
      r = dr.renderer.world.getLocalPlayer();
    (this.playerPartyMembers = t),
      (this.playerPartyCanSell = !0 === t.find((t) => t.uid === r).canSell),
      (this.playerPartyCanPlace = !0 === t.find((t) => t.uid === r).canPlace),
      dr.eventEmitter.emit("PartyMembersUpdated", t);
    for (const t in this.buildingData) {
      const r = this.buildingData[t];
      r.limit = r.limitPerMember * (!1 === r.limitStatic ? e : 1);
    }
    dr.eventEmitter.emit("BuildingDataUpdated");
  }
  onMouseMoved({ event: t }) {
    (this.mousePosition = {
      x: t.clientX,
      y: t.clientY,
    }),
      this.components.uiPlacementOverlay.update(),
      this.components.uiPlacementOverlay.isActive() &&
        !0 === dr.network.inputPacketManager.mouseDown &&
        this.components.uiPlacementOverlay.placeBuilding();
  }
  onMouseDown({ event: t }) {
    this.components.uiPlacementOverlay.isActive() &&
      this.components.uiPlacementOverlay.placeBuilding();
    for (let t in this.components.uiTopBar.menuIcons)
      this.components.uiTopBar.menuIcons[t].hide();
  }
  onMouseUp({ event: t }) {
    if (
      this.components.uiReconnection.isVisible() ||
      this.components.uiRespawn.isVisible()
    )
      return;
    if (this.components.uiPlacementOverlay.isActive()) return;
    for (let t in this.components.uiTopBar.menuIcons)
      this.components.uiTopBar.menuIcons[t].hide();
    if ("Pickaxe" !== this.playerTick?.weaponName)
      return this.components.uiBuildingOverlay.onWorldMouseUp(t);
    if (1 == this.castingSpell) return;
    const e = dr.renderer.world,
      r = dr.renderer.screenToWorld(this.mousePosition.x, this.mousePosition.y),
      n = e.entityGrid.getCellIndices(r.x, r.y, {
        width: 1,
        height: 1,
      }),
      i = n.length > 0 && n[0];
    if (!1 === i) return;
    const o = e.entityGrid.getEntitiesInCell(i),
      s = this.components.uiBuildingOverlay;
    for (const r in o) {
      const n = parseInt(r);
      if (n == s.buildingUid) return s.onWorldMouseUp(t);
      const i = e.entities[n].getTargetTick();
      for (const e in this.buildingData)
        if (e == i.model) return s.onWorldMouseUp(t), void s.startWatching(n);
    }
    s.onWorldMouseUp(t);
  }
  onRightMouseUp({ event: t }) {
    this.components.uiBuildingOverlay.onRightMouseUp(t),
      this.components.uiPlacementOverlay.cancelPlacing();
  }
  onSocketOpened() {
    this.components.uiReconnection.hide();
  }
  onSocketClosed() {
    this.components.uiMenuGridParties.hide(),
      this.components.uiMenuGridSettings.hide(),
      this.components.uiMenuGridShop.hide(),
      this.components.uiMenuGridSpells.hide(),
      this.components.uiRespawn.hide(),
      this.components.uiReconnection.show();
  }
  onBeforeUnload(t) {
    if (dr.getInWorld() || void 0 !== this.playerTick || 1 === this.playerTick?.dead)
      return (
        (t.returnValue =
          "Leaving the page will cause you to lose all progress. Are you sure?"),
        t.returnValue
      );
  }
  getFactory() {
    return this.factory;
  }
  setPlayerTick(t) {
    (this.lastPlayerTick = this.playerTick), (this.playerTick = t);
    for (let t of ["wood", "stone", "gold", "tokens", "wave"])
      null !== this.lastPlayerTick
        ? this.lastPlayerTick[t] !== this.playerTick[t] &&
          dr.eventEmitter.emit(`${t}CountUpdated`)
        : dr.eventEmitter.emit(`${t}CountUpdated`);
    dr.eventEmitter.emit("PlayerTickUpdated", t);
  }
  getPlayerTick() {
    return this.playerTick;
  }
  getLastPlayerTick() {
    return this.lastPlayerTick;
  }
  onPartyBuildingUpdate(t) {
    for (let e in t) {
      const r = t[e];
      if (
        (1 == r.dead ? delete this.buildings[r.uid] : (this.buildings[r.uid] = r),
        "Factory" == r.type)
      ) {
        this.factory = r.dead ? null : r;
        for (const t in this.buildingData) this.buildingData[t].disabled = r.dead;
        this.buildingData.Factory.disabled = !r.dead;
      }
      this.buildingData[r.type].built = 0;
      for (const t in this.buildings)
        this.buildings[t].type == r.type && this.buildingData[r.type].built++;
    }
    dr.eventEmitter.emit("BuildingsUpdated", t);
  }
}
*/
