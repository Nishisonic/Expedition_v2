/**
 * 遠征報告書v2.1
 * @version 1.0.3
 * @author Nishisonic
 */

AppConstants = Java.type('logbook.constants.AppConstants')
DataType = Java.type('logbook.data.DataType')
GlobalContext = Java.type('logbook.data.context.GlobalContext')
UseItem = Java.type('logbook.internal.UseItem')

PrintWriter = Java.type('java.io.PrintWriter')
StandardCharsets = Java.type('java.nio.charset.StandardCharsets')
Files = Java.type('java.nio.file.Files')
Paths = Java.type('java.nio.file.Paths')
StandardOpenOption = Java.type('java.nio.file.StandardOpenOption')
SimpleDateFormat = Java.type('java.text.SimpleDateFormat')
Date = Java.type('java.util.Date')

var PATH = Paths.get('遠征報告書v2.2.csv')
var PATH2 = Paths.get('遠征報告書v2.2_alternative.csv')

function update(type, data) {
  switch (type) {
    case DataType.MISSION_RESULT:
      write(getContent(data))
      break
    default:
      break
  }
}

function write(s, p) {
  try {
    var pw
    var path = p === undefined ? PATH : p
    if (Files.notExists(path)) {
      pw = new PrintWriter(
        Files.newBufferedWriter(path, StandardCharsets.UTF_8)
      )
      pw.println(getHeader())
    } else {
      pw = new PrintWriter(
        Files.newBufferedWriter(
          path,
          StandardCharsets.UTF_8,
          StandardOpenOption.WRITE,
          StandardOpenOption.APPEND
        )
      )
    }
    pw.println(s)
    pw.close()
  } catch (e) {
    e.printStackTrace()
    if (!path.equals(PATH2)) {
      write(s, PATH2)
    }
  }
}

function getHeader() {
  var hedder = [
    '日付',
    '結果',
    '遠征',
    '燃料',
    '弾薬',
    '鋼材',
    'ボーキ',
    'アイテム1.名前',
    'アイテム1.個数',
    'アイテム2.名前',
    'アイテム2.個数',
    '取得提督経験値',
    '提督レベル'
  ]
  var shipHedder = [
    'ID',
    '名前',
    '種別',
    '取得経験値',
    '疲労',
    '残耐久',
    '最大耐久',
    '損傷',
    '残燃料',
    '最大燃料',
    '残弾薬',
    '最大弾薬',
    'Lv',
    '速力',
    '火力',
    '雷装',
    '対空',
    '装甲',
    '回避',
    '対潜',
    '索敵',
    '運',
    '射程'
  ]
  var itemHedder = ['名前', '改修', '熟練度', '搭載数']
  for (var i = 1; i <= 6; i++) {
    shipHedder
      .map(function (title) {
        return '遠征艦' + i + '.' + title
      })
      .forEach(function (title) {
        hedder.push(title)
      })
    for (var j = 1; j <= 6; j++) {
      itemHedder
        .map(function (title) {
          return '遠征艦' + i + '.装備' + j + '.' + title
        })
        .forEach(function (title) {
          hedder.push(title)
        })
    }
  }
  return hedder.join(',')
}

function getContent(data) {
  var content = []
  var date = new Date()
  var sdf = new SimpleDateFormat(AppConstants.DATE_FORMAT)
  content.push(sdf.format(date))
  content.push(
    (function (flag) {
      switch (flag) {
        case 0:
          return '失敗'
        case 1:
          return '成功'
        case 2:
          return '大成功'
        default:
          return '不明(' + flag + ')'
      }
    })(data.jsonObject.api_data.api_clear_result.intValue())
  )
  content.push(data.jsonObject.api_data.api_quest_name.toString())
  if (data.jsonObject.api_data.api_clear_result.intValue() === 0) {
    content.push(0)
    content.push(0)
    content.push(0)
    content.push(0)
  } else {
    content.push(data.jsonObject.api_data.api_get_material[0].intValue())
    content.push(data.jsonObject.api_data.api_get_material[1].intValue())
    content.push(data.jsonObject.api_data.api_get_material[2].intValue())
    content.push(data.jsonObject.api_data.api_get_material[3].intValue())
  }
  for (var i = 0; i < 2; i++) {
    var useItemFlag = data.jsonObject.api_data.api_useitem_flag[i].intValue()
    if (useItemFlag > 0) {
      var item = data.jsonObject.api_data['api_get_item' + (i + 1)]
      var itemId = item.api_useitem_id.intValue()
      if (itemId <= 0) {
        itemId = useItemFlag
      }
      var itemCount = item.api_useitem_count.intValue()
      content.push(getItemName(itemId))
      content.push(itemCount)
    } else {
      content.push('')
      content.push('')
    }
  }
  content.push(data.jsonObject.api_data.api_get_exp.intValue())
  content.push(data.jsonObject.api_data.api_member_lv)
  var id = data.getField('api_deck_id')
  var ships = GlobalContext.getDock(id).ships
  return content
    .concat(
      Java.from(ships).map(function (ship, i) {
        return [
          ship.shipId,
          ship.fullName,
          ship.type,
          i < data.jsonObject.api_data.api_get_ship_exp.length ?
          data.jsonObject.api_data.api_get_ship_exp[i] :
          '',
          ship.cond,
          ship.nowhp,
          ship.maxhp,
          (function (ship) {
            if (ship.isSunk()) return '轟沈'
            if (ship.isBadlyDamage()) return '大破'
            if (ship.isHalfDamage()) return '中破'
            if (ship.isSlightDamage()) return '小破'
            return '小破未満'
          })(ship),
          ship.fuel,
          ship.fuelMax,
          ship.bull,
          ship.bullMax,
          ship.lv,
          ship.param.sokuString,
          ship.param.karyoku,
          ship.param.raisou,
          ship.param.taiku,
          ship.param.soukou,
          ship.param.kaihi,
          ship.param.taisen,
          ship.param.sakuteki,
          ship.param.lucky,
          ship.param.lengString,
          (function (ship) {
            var item2 = Java.from(ship.item2)
              .concat(Array.apply(null, new Array(5 - ship.slotNum)))
              .concat([ship.onSlotExItem])
            var onSlot = Java.from(ship.onSlot).concat([0])
            return Array.apply(null, new Array(6)).map(function (v, i) {
              if (item2[i]) {
                var item = item2[i]
                return [item.name, item.level, item.alv, onSlot[i]]
              }
              return ['', '', '', '']
            })
          })(ship)
        ].join(',')
      })
    )
    .join(',')
}

function getItemName(useItemId) {
  if (useItemId === AppConstants.USEITEM_UNKNOWN) {
    return '<UNKNOWN>'
  }
  var name = UseItem.get(useItemId)
  return name ? name : ''
}
